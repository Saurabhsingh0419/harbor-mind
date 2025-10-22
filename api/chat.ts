// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import admin from "firebase-admin";

if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

// --- MODIFIED ---
// Using "gemini-pro" as it's the most stable, standard model
// and does not support the "responseMimeType" config.
const model = genAI.getGenerativeModel({
  model: "gemini-pro", 
  safetySettings,
  // generationConfig was removed
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

// --- SYSTEM PROMPT ---
const SYSTEM_PROMPT = `
You are “Safe Harbor AI” — an empathetic student companion for mental well-being.
Detect the user's mood (sad, anxious, angry, calm, happy, lonely, neutral) from their message,
respond warmly and naturally with one short empathetic reply.

Do not mention “I detect your mood”. 
If distress/self-harm is mentioned, remind them to reach a counselor or emergency help.

You MUST return ONLY a valid JSON object matching this exact schema, with no other text:
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

    // Call the Gemini API
    const result = await model.generateContent(fullPrompt);
    const raw = result.response.text();
    
    let response = { mood: "neutral", reply: "Sorry, I had trouble thinking." };

    // Robust JSON parsing
    try {
      const jsonStart = raw.indexOf("{");
      const jsonEnd = raw.lastIndexOf("}");
      
      if (jsonStart > -1 && jsonEnd > -1) {
        const jsonString = raw.slice(jsonStart, jsonEnd + 1);
        response = JSON.parse(jsonString);
      } else {
        console.error("No JSON found in Gemini response:", raw);
        response.reply = raw.trim().replace(/"/g, '');
      }
    } catch (err) {
      console.error("Gemini JSON parse fail:", err, raw);
      response.reply = raw.trim().replace(/"/g, '');
    }

    // Firestore save logic
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
        return res.status(4G).json({ error: "Token expired, please refresh." });
      }
    }
    
    res.status(500).json({ error: "Internal server error" });
  }
}