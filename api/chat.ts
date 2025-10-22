// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from "@google/generative-ai";
import admin from "firebase-admin";

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

// 1. --- MODIFIED ---
// We are switching to 'gemini-pro', which is universally available.
// We must remove the 'generationConfig' for 'responseMimeType'
// because 'gemini-pro' does not support it.
const model = genAI.getGenerativeModel({
  model: "gemini-pro", // Switched to gemini-pro
  safetySettings,
  // 'generationConfig' with 'responseMimeType' has been removed
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

// 2. --- MODIFIED ---
// The prompt is updated to be even more strict about
// *only* returning JSON, since we can't force it.
const SYSTEM_PROMPT = `
You are “Safe Harbor AI” — an empathetic student companion for mental well-being.
Detect the user's mood (sad, anxious, angry, calm, happy, lonely, neutral) from their message,
respond warmly and naturally with one short empathetic reply.

Do not mention “I detect your mood”. 
If distress/self-harm is mentioned, remind them to reach a counselor or emergency help.

You MUST return ONLY a valid JSON object matching this exact schema, with no other text:
{"mood":"<oneword>","reply":"<short empathetic response>"}
`;

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
      .map((m: any) => `${m.sender === "user" ? "User" : "AI"}: ${m.text}`)
      .join("\n");

    const fullPrompt = `
    ${SYSTEM_PROMPT}

    Previous conversation:
    ${memory || "None"}

    User: ${message}
    `;

    // UNCHANGED: Call the Gemini API
    const result = await model.generateContent(fullPrompt);
    const raw = result.response.text();
    
    let response = { mood: "neutral", reply: "Sorry, I had trouble thinking." };

    // 3. --- MODIFIED ---
    // This 'try...catch' block is now more robust. It will find
    // the JSON inside the raw text (e.g., if Gemini wraps it
    // in ```json ... ``` tags).
    try {
      // Find the start and end of the JSON block
      const jsonStart = raw.indexOf("{");
      const jsonEnd = raw.lastIndexOf("}");
      
      if (jsonStart > -1 && jsonEnd > -1) {
        const jsonString = raw.slice(jsonStart, jsonEnd + 1);
        response = JSON.parse(jsonString);
      } else {
        // Fallback if no JSON is found at all
        console.error("No JSON found in Gemini response:", raw);
        response.reply = raw.trim().replace(/"/g, ''); // Clean up string
      }
    } catch (err) {
      console.error("Gemini JSON parse fail:", err, raw);
      response.reply = raw.trim().replace(/"/g, ''); // Clean up string
    }

    // UNCHANGED: Firestore save logic
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
    
    if (typeof err === 'object' && err !== null && 'code' in err) {
      const firebaseError = err as { code: string };
      if (firebaseError.code === "auth/id-token-expired") {
        return res.status(401).json({ error: "Token expired, please refresh." });
      }
    }
    
    // Also log the error details if it's a Google AI error
    if (typeof err === 'object' && err !== null && 'message' in err) {
        console.error("Error Message:", (err as Error).message);
    }
    
    res.status(500).json({ error: "Internal server error" });
  }
}