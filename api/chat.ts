// api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { VertexAI, HarmCategory, HarmBlockThreshold } from "@google-cloud/vertexai";
import admin from "firebase-admin";

// Validate environment variables
const requiredEnvVars = {
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
  VERTEX_CLIENT_EMAIL: process.env.VERTEX_CLIENT_EMAIL,
  VERTEX_PRIVATE_KEY: process.env.VERTEX_PRIVATE_KEY,
};

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// Process private key with robust newline handling
const privateKey = process.env.VERTEX_PRIVATE_KEY!
  .split('\\n').join('\n')  // Handle escaped newlines
  .replace(/\\\\n/g, '\n')  // Handle double-escaped newlines
  .trim();

// Validate private key format
if (!privateKey.includes('BEGIN PRIVATE KEY')) {
  console.error('Private key appears to be malformed');
  throw new Error('Invalid private key format');
}

// Initialize Vertex AI with explicit auth options
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT_ID!,
  location: 'asia-south1',
  googleAuthOptions: {
    credentials: {
      client_email: process.env.VERTEX_CLIENT_EMAIL!,
      private_key: privateKey,
    },
    scopes: [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/generative-language.retriever',
    ],
  },
});

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const modelInstance = vertexAI.getGenerativeModel({
  model: "gemini-1.5-flash-001",
  safetySettings,
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.7,
    maxOutputTokens: 1024,
  },
});

// Initialize Firebase Admin
let db: admin.firestore.Firestore;
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
    });
  }
  db = admin.firestore();
} catch (error) {
  console.error("Firebase initialization error:", error);
  throw error;
}

const SYSTEM_PROMPT = `You are "Safe Harbor AI" — an empathetic student companion for mental well-being.
Detect the user's mood (sad, anxious, angry, calm, happy, lonely, neutral) from their message,
respond warmly and naturally with one short empathetic reply.

You MUST return ONLY a valid JSON object matching this exact schema:
{"mood":"<oneword>","reply":"<short empathetic response>"}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify Firebase token
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: "Missing message" });
    }

    // Fetch chat history
    const snaps = await db
      .collection("ai-chats")
      .where("userId", "==", userId)
      .orderBy("timestamp", "desc")
      .limit(6)
      .get();

    const memory = snaps.docs
      .reverse()
      .map((d) => d.data())
      .map((m: admin.firestore.DocumentData) => 
        `${m.sender === "user" ? "User" : "AI"}: ${m.text}`
      )
      .join("\n");

    const fullPrompt = `${SYSTEM_PROMPT}

Previous conversation:
${memory || "None"}

User: ${message}`;

    // Call Vertex AI
    console.log("Calling Vertex AI...");
    const result = await modelInstance.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
    });

    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error("No response from Vertex AI");
    }

    let response = { mood: "neutral", reply: "Sorry, I had trouble thinking." };
    try {
      response = JSON.parse(responseText);
    } catch {
      response.reply = responseText.trim();
    }

    // Save to Firestore
    const now = admin.firestore.FieldValue.serverTimestamp();
    await Promise.all([
      db.collection("ai-chats").add({ 
        userId, 
        sender: "user", 
        text: message, 
        timestamp: now 
      }),
      db.collection("ai-chats").add({ 
        userId, 
        sender: "ai", 
        text: response.reply, 
        mood: response.mood, 
        timestamp: now 
      }),
    ]);

    return res.status(200).json(response);

  } catch (error: unknown) {
    console.error("API Handler Error:", error);
    
    if (error instanceof Error) {
      // Check for specific auth errors
      if (error.message.includes('authenticate') || error.message.includes('credentials')) {
        console.error("Authentication error detected");
        return res.status(500).json({ 
          error: "Authentication failed with Vertex AI",
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    }
    
    return res.status(500).json({ error: "Internal server error" });
  }
}