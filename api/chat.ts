// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  VertexAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google-cloud/vertexai"; // Correct import for Vertex AI
import admin from "firebase-admin";

// --- START OF VERTEX AI SETUP ---

// Check required Vertex AI environment variables
if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
  console.error('CRITICAL: GOOGLE_CLOUD_PROJECT_ID environment variable is not set!');
  throw new Error('Server configuration error: Missing Google Cloud Project ID.');
} else {
    console.log('GOOGLE_CLOUD_PROJECT_ID environment variable found.');
}
if (!process.env.VERTEX_CLIENT_EMAIL) {
  console.error('CRITICAL: VERTEX_CLIENT_EMAIL environment variable is not set!');
  throw new Error('Server configuration error: Missing Vertex AI client email.');
} else {
    console.log('VERTEX_CLIENT_EMAIL environment variable found.');
}
if (!process.env.VERTEX_PRIVATE_KEY) {
  console.error('CRITICAL: VERTEX_PRIVATE_KEY environment variable is not set!');
  throw new Error('Server configuration error: Missing Vertex AI private key.');
} else {
    console.log('VERTEX_PRIVATE_KEY environment variable found (starts with: ' + process.env.VERTEX_PRIVATE_KEY.substring(0, 30) + '...).');
}

let vertex_ai;
try {
    // Initialize Vertex AI using individual credential components
    vertex_ai = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID!,
      location: 'us-central1', // Or your preferred region
      credentials: {
          client_email: process.env.VERTEX_CLIENT_EMAIL!,
          private_key: process.env.VERTEX_PRIVATE_KEY!.replace(/\\n/g, '\n'), // Replace escaped newlines
      }
    });
    console.log('VertexAI client initialized successfully using separate credentials.');
} catch (initError) {
    console.error("CRITICAL: Failed to initialize VertexAI client:", initError);
    throw new Error('Server configuration error: VertexAI client initialization failed.');
}

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const modelInstance = vertex_ai.getGenerativeModel({
  model: "gemini-1.5-flash-001", // Make sure this model is available in your region via Vertex
  safetySettings,
  generationConfig: {
     responseMimeType: "application/json",
  },
});
console.log('Generative model instance created.');

// --- END OF VERTEX AI SETUP ---


// --- START OF ROBUST FIREBASE ADMIN SETUP ---

// Check required Firebase environment variables
if (!process.env.FIREBASE_PROJECT_ID) { // Use FIREBASE_PROJECT_ID specifically for Firebase
  console.error('CRITICAL: FIREBASE_PROJECT_ID environment variable is not set!');
  throw new Error('Server configuration error: Missing Firebase Project ID.');
} else {
    console.log('FIREBASE_PROJECT_ID environment variable found.');
}
if (!process.env.FIREBASE_CLIENT_EMAIL) {
  console.error('CRITICAL: FIREBASE_CLIENT_EMAIL environment variable is not set!');
  throw new Error('Server configuration error: Missing Firebase client email.');
} else {
    console.log('FIREBASE_CLIENT_EMAIL environment variable found.');
}
if (!process.env.FIREBASE_PRIVATE_KEY) {
  console.error('CRITICAL: FIREBASE_PRIVATE_KEY environment variable is not set!');
  throw new Error('Server configuration error: Missing Firebase private key.');
} else {
    console.log('FIREBASE_PRIVATE_KEY environment variable found.');
}

let db: admin.firestore.Firestore; // Declare db variable

try {
  if (!admin.apps.length) {
    console.log("Initializing Firebase Admin SDK...");
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'), // Format key
      }),
    });
    console.log("Firebase Admin Initialized Successfully.");
    db = admin.firestore(); // Initialize db after success
    console.log("Firestore instance created.");
  } else {
      console.log("Firebase Admin already initialized.");
      db = admin.firestore(); // Get instance from existing app
      console.log("Firestore instance retrieved from existing app.");
  }
} catch (error) {
  console.error("CRITICAL: Firebase Admin Initialization Error:", error);
  throw new Error('Server configuration error: Firebase Admin SDK initialization failed.');
}

// Check if db was successfully initialized
if (!db) {
    console.error("CRITICAL: Firestore database instance is not available.");
    throw new Error('Server configuration error: Firestore initialization failed.');
}

// --- END OF ROBUST FIREBASE ADMIN SETUP ---


// --- SYSTEM PROMPT (UNCHANGED) ---
const SYSTEM_PROMPT = `
You are “Safe Harbor AI” — an empathetic student companion for mental well-being.
Detect the user's mood (sad, anxious, angry, calm, happy, lonely, neutral) from their message,
respond warmly and naturally with one short empathetic reply.

Do not mention “I detect your mood”.
If distress/self-harm is mentioned, remind them to reach a counselor or emergency help.

You MUST return ONLY a valid JSON object matching this exact schema:
{"mood":"<oneword>","reply":"<short empathetic response>"}
`;


// --- HANDLER FUNCTION (UNCHANGED LOGIC, INCLUDES DB CHECK) ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("API Handler started");

  // Ensure db is available
  if (!db) {
      console.error("Handler Error: Firestore DB not initialized.");
      return res.status(500).json({ error: "Internal server configuration error." });
  }

  if (req.method !== "POST") {
      console.log("Method not allowed:", req.method);
      return res.status(405).send("Only POST allowed");
  }

  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
        console.log("Unauthorized: No token provided");
        return res.status(401).json({ error: "Unauthorized" });
    }

    let decodedToken;
    try {
        decodedToken = await admin.auth().verifyIdToken(token);
        console.log("Token verified successfully for UID:", decodedToken.uid);
    } catch (authError) {
        console.error("Token verification failed:", authError);
        if (authError instanceof Error && (authError as any).code === 'auth/id-token-expired') {
            return res.status(401).json({ error: "Token expired, please refresh." });
        }
        return res.status(401).json({ error: "Invalid token" });
    }
    const userId = decodedToken.uid;

    const { message } = req.body;
    if (!message) {
        console.log("Bad Request: Missing message");
        return res.status(400).json({ error: "Missing message" });
    }
    console.log("Received message:", message);

    console.log("Fetching chat history from Firestore...");
    const snaps = await db
      .collection("ai-chats")
      .where("userId", "==", userId)
      .orderBy("timestamp", "desc")
      .limit(6)
      .get();
    console.log(`Found ${snaps.docs.length} previous messages.`);

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
    console.log("Constructed full prompt for Vertex AI.");

    console.log("Calling Vertex AI generateContent...");
    // Use the modelInstance created from VertexAI
    const result = await modelInstance.generateContent({contents: [{role: 'user', parts: [{text: fullPrompt}]}]});

    if (!result.response.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error("Unexpected Vertex AI response structure:", JSON.stringify(result.response, null, 2));
        throw new Error("Failed to get text from Vertex AI response");
    }
    const raw = result.response.candidates[0].content.parts[0].text;
    console.log("Received raw response from Vertex AI:", raw);

    let response = { mood: "neutral", reply: "Sorry, I had trouble thinking." };

    try {
      response = JSON.parse(raw); // Should work due to responseMimeType
    } catch (err) {
      console.error("Vertex AI JSON parse fail:", err, raw);
      response.reply = raw.trim(); // Fallback
    }
    console.log("Parsed AI response:", response);

    const now = admin.firestore.FieldValue.serverTimestamp();
    console.log("Saving messages to Firestore...");
    // Use the db instance initialized earlier
    await db.collection("ai-chats").doc().set({ userId, sender: "user", text: message, timestamp: now });
    await db.collection("ai-chats").doc().set({ userId, sender: "ai", text: response.reply, mood: response.mood, timestamp: now });
    console.log("Messages saved successfully.");

    return res.status(200).json(response);

  } catch (err: unknown) {
    console.error("--- API Handler Error ---");
    console.error("Timestamp:", new Date().toISOString());

    if (err instanceof Error) {
        console.error("Error Type:", err.name);
        console.error("Error Message:", err.message);
        console.error("Error Stack:", err.stack);
    } else {
        console.error("Unknown error object:", err);
    }
    console.error("--- End API Handler Error ---");

    res.status(500).json({ error: "Internal server error" });
  }
}