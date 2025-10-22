// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  VertexAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google-cloud/vertexai";
import admin from "firebase-admin";

// --- START OF ENHANCED SETUP CODE ---

// 1. Check if the environment variable exists
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  console.error('CRITICAL: GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set!');
  // Exit early or handle appropriately - without credentials, nothing will work.
  // For a serverless function, throwing might be okay, or return an error response.
  throw new Error('Server configuration error: Missing credentials.');
} else {
    console.log('GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable found.');
}

if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
  console.error('CRITICAL: GOOGLE_CLOUD_PROJECT_ID environment variable is not set!');
  throw new Error('Server configuration error: Missing Google Cloud Project ID.');
} else {
    console.log('GOOGLE_CLOUD_PROJECT_ID environment variable found.');
}


let credentials;
try {
  // 2. Try to parse the JSON credentials
  const credsJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  credentials = JSON.parse(credsJsonString);
  console.log('Successfully parsed GOOGLE_APPLICATION_CREDENTIALS_JSON.');
  // Optional: Log specific fields to verify, but be careful with sensitive data in logs
  // console.log('Parsed Project ID:', credentials.project_id);
  // console.log('Parsed Client Email:', credentials.client_email);
} catch (e) {
  console.error("CRITICAL: Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:", e);
  // Log the first few characters to help debug without exposing the whole key
  console.error("Credentials JSON starts with:", process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.substring(0, 50) + "...");
  throw new Error('Server configuration error: Invalid credentials format.');
}

let vertex_ai;
try {
    // 3. Initialize Vertex AI using the parsed credentials
    vertex_ai = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID!,
      location: 'us-central1', // Or your preferred region
      credentials, // Pass the parsed credentials directly
    });
    console.log('VertexAI client initialized successfully.');
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
  model: "gemini-1.5-flash-001", // Specific Vertex AI model name
  safetySettings,
  generationConfig: {
     responseMimeType: "application/json",
  },
});
console.log('Generative model instance created.');

// --- END OF ENHANCED SETUP CODE ---


// --- FIREBASE ADMIN SETUP (UNCHANGED) ---
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID, // Use separate Firebase creds if needed
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
    console.log("Firebase Admin Initialized Successfully");
  } else {
      console.log("Firebase Admin already initialized.");
  }
} catch (error) {
  console.error("Firebase Admin Initialization Error:", error);
  // Decide if this is critical enough to stop the function
}
const db = admin.firestore();

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


// --- HANDLER FUNCTION (UNCHANGED LOGIC) ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("API Handler started");
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
        // Check if the error is due to expiration
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
    const result = await modelInstance.generateContent({contents: [{role: 'user', parts: [{text: fullPrompt}]}]});

    if (!result.response.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error("Unexpected Vertex AI response structure:", JSON.stringify(result.response, null, 2));
        throw new Error("Failed to get text from Vertex AI response");
    }
    const raw = result.response.candidates[0].content.parts[0].text;
    console.log("Received raw response from Vertex AI:", raw);

    let response = { mood: "neutral", reply: "Sorry, I had trouble thinking." };

    try {
      response = JSON.parse(raw);
    } catch (err) {
      console.error("Vertex AI JSON parse fail:", err, raw);
      response.reply = raw.trim();
    }
    console.log("Parsed AI response:", response);

    const now = admin.firestore.FieldValue.serverTimestamp();
    console.log("Saving messages to Firestore...");
    await db.collection("ai-chats").doc().set({ userId, sender: "user", text: message, timestamp: now });
    await db.collection("ai-chats").doc().set({ userId, sender: "ai", text: response.reply, mood: response.mood, timestamp: now });
    console.log("Messages saved successfully.");

    return res.status(200).json(response);

  } catch (err: unknown) {
    console.error("--- API Handler Error ---"); // Make error stand out
    console.error("Timestamp:", new Date().toISOString());

    if (err instanceof Error) {
        console.error("Error Type:", err.name);
        console.error("Error Message:", err.message);
        console.error("Error Stack:", err.stack);
        // Check if it's the specific auth error we were seeing
        if (err.message.includes("Unable to authenticate")) {
            console.error(">>> Authentication failed! Check GOOGLE_APPLICATION_CREDENTIALS_JSON in Vercel. <<<");
        }
    } else {
        console.error("Unknown error object:", err);
    }
    console.error("--- End API Handler Error ---");

    res.status(500).json({ error: "Internal server error" });
  }
}