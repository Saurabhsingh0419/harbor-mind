// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
// NEW: Import Google Generative AI
import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from "@google/generative-ai";
import admin from "firebase-admin";

// NEW: Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// NEW: Set safety settings to be less restrictive on sensitive topics
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// NEW: Configure the model for JSON output
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest", // Great, fast model
  safetySettings,
  generationConfig: {
    responseMimeType: "application/json", // This forces JSON output!
  },
});

// UNCHANGED: Firebase Admin Initialization
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

// UPDATED: System prompt optimized for Gemini's JSON mode
const SYSTEM_PROMPT = `
You are “Safe Harbor AI” — an empathetic student companion for mental well-being.
Detect the user's mood (sad, anxious, angry, calm, happy, lonely, neutral) from their message,
respond warmly and naturally with one short empathetic reply.

Do not mention “I detect your mood”. 
If distress/self-harm is mentioned, remind them to reach a counselor or emergency help.

You MUST return ONLY a valid JSON object matching this exact schema:
{"mood":"<oneword>","reply":"<short empathetic response>"}
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).send("Only POST allowed");

  try {
    // UNCHANGED: Token verification
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Missing message" });

    // UNCHANGED: Load last few messages
    const snaps = await db
      .collection("ai-chats")
      .where("userId", "==", userId)
      .orderBy("timestamp", "desc")
      .limit(6)
      .get();

    const memory = snaps.docs
      .reverse()
      .map((d) => d.data())
      .map((m: any) => `${m.sender === "user" ? "User" : "AI"}: ${m.text}`)
      .join("\n");

    // UNCHANGED: We still build one big prompt
    const fullPrompt = `
    ${SYSTEM_PROMPT}

    Previous conversation:
    ${memory || "None"}

    User: ${message}
    `;

    // NEW: Call the Gemini API
    const result = await model.generateContent(fullPrompt);
    const raw = result.response.text();
    
    let response = { mood: "neutral", reply: "Sorry, I had trouble thinking." };

    try {
      // Because we set `responseMimeType`, 'raw' should be a valid JSON string
      response = JSON.parse(raw);
    } catch (err) {
      console.error("Gemini JSON parse fail:", err, raw);
      // Fallback if Gemini fails to provide JSON
      response.reply = raw.trim().replace(/"/g, ''); // Clean up stray quotes
    }

    // UNCHANGED: Firestore save logic
    const now = admin.firestore.FieldValue.serverTimestamp();

    const userMessageRef = db.collection("ai-chats").doc();
    await userMessageRef.set({
      userId: userId,
      sender: "user",
      text: message,
      timestamp: now,
    });

    const aiMessageRef = db.collection("ai-chats").doc();
    await aiMessageRef.set({
      userId: userId,
      sender: "ai",
      text: response.reply,
      mood: response.mood, // Add the new mood field
      timestamp: now,
    });

    // UNCHANGED: Send response to frontend
    return res.status(200).json(response);

  } catch (err: any) {
    console.error("API Error:", err);
    if (err.code === "auth/id-token-expired") {
      return res.status(401).json({ error: "Token expired, please refresh." });
    }
    res.status(500).json({ error: "Internal server error" });
  }
}