// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
// NEW: Import OpenAI
import OpenAI from "openai";
import admin from "firebase-admin";

// NEW: Initialize OpenAI Client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- FIREBASE ADMIN SETUP ---
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
} catch (error) {
  console.error("Firebase Admin Initialization Error:", error);
}
const db = admin.firestore();

// --- SYSTEM PROMPT (for OpenAI) ---
const SYSTEM_PROMPT = `
You are “Safe Harbor AI” — an empathetic student companion for mental well-being.
Detect the user's mood (sad, anxious, angry, calm, happy, lonely, neutral) from their message,
respond warmly and naturally with one short empathetic reply.

Do not mention “I detect your mood”. 
If distress/self-harm is mentioned, remind them to reach a counselor or emergency help.

You MUST return ONLY a valid JSON object matching this exact schema:
{"mood":"<oneword>","reply":"<short empathetic response>"}
`;

// --- HANDLER FUNCTION ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).send("Only POST allowed");

  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Missing message" });

    // Load conversation history (UNCHANGED)
    const snaps = await db
      .collection("ai-chats")
      .where("userId", "==", userId)
      .orderBy("timestamp", "desc")
      .limit(6)
      .get();

    const memory = snaps.docs
      .reverse()
      .map((d) => d.data())
      .map((m: admin.firestore.DocumentData) => `${m.sender === "user" ? "User" : "AI"}: ${m.text}`)
      .join("\n");

    const fullPrompt = `
    ${SYSTEM_PROMPT}

    Previous conversation:
    ${memory || "None"}

    User: ${message}
    `;

    // NEW: Call the OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Fast and cheap
      response_format: { type: "json_object" }, // Enable JSON mode
      messages: [{ role: "system", content: fullPrompt }],
      temperature: 0.8,
    });

    const raw = completion.choices[0]?.message?.content || "";
    
    let response = { mood: "neutral", reply: "Sorry, I had trouble thinking." };

    try {
      // Because we requested JSON, 'raw' should be a perfect JSON string
      response = JSON.parse(raw);
    } catch (err) {
      console.error("OpenAI JSON parse fail:", err, raw);
      response.reply = raw.trim(); // Fallback
    }

    // Firestore save logic (UNCHANGED)
    const now = admin.firestore.FieldValue.serverTimestamp();

    await db.collection("ai-chats").doc().set({
      userId: userId,
      sender: "user",
      text: message,
      timestamp: now,
    });

    await db.collection("ai-chats").doc().set({
      userId: userId,
      sender: "ai",
      text: response.reply,
      mood: response.mood,
      timestamp: now,
    });

    return res.status(200).json(response);

  } catch (err: unknown) {
    console.error("API Error:", err);
    
    if (typeof err === 'object' && err !== null && 'message' in err) {
        console.error("Error Message:", (err as Error).message);
    }

    if (typeof err === 'object' && err !== null && 'code' in err) {
      const firebaseError = err as { code: string };
      if (firebaseError.code === "auth/id-token-expired") {
        return res.status(401).json({ error: "Token expired, please refresh." });
      }
    }
    
    res.status(500).json({ error: "Internal server error" });
  }
}