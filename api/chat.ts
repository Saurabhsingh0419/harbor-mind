// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  VertexAI, // Import VertexAI instead of GoogleGenerativeAI
  HarmCategory,
  HarmBlockThreshold,
} from "@google-cloud/vertexai"; // Use the Vertex AI specific package
import admin from "firebase-admin";

// --- START OF NEW SETUP CODE ---

// Verify Project ID exists
if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
  console.error('GOOGLE_CLOUD_PROJECT_ID is not set');
  // We'll let the handler fail if this happens
}

// Initialize Vertex AI
// NOTE: Vertex AI uses Application Default Credentials (ADC) or Service Accounts
// It does NOT use API keys directly in production for security reasons.
// However, the `@google-cloud/vertexai` library might still pick up ADC
// if your Firebase Admin setup provides them implicitly.
// We also need to specify the project and location.
const vertex_ai = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT_ID!,
  location: 'us-central1', // Or your preferred region
});

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Get the generative model instance via Vertex AI
const modelInstance = vertex_ai.getGenerativeModel({
  model: "gemini-1.5-flash-001", // Using a specific Vertex AI model name
  safetySettings,
  generationConfig: {
     responseMimeType: "application/json",
  },
});

// --- END OF NEW SETUP CODE ---


// --- FIREBASE ADMIN SETUP (UNCHANGED) ---
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
    console.log("Firebase Admin Initialized Successfully");
  }
} catch (error) {
  console.error("Firebase Admin Initialization Error:", error);
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


// --- HANDLER FUNCTION ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("API Handler started"); // Add log
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
        return res.status(401).json({ error: "Invalid or expired token" });
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

    // --- MODIFIED: Call Vertex AI ---
    console.log("Calling Vertex AI generateContent...");
    const result = await modelInstance.generateContent({contents: [{role: 'user', parts: [{text: fullPrompt}]}]});

    // Access response differently for Vertex AI SDK
    if (!result.response.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error("Unexpected Vertex AI response structure:", JSON.stringify(result.response, null, 2));
        throw new Error("Failed to get text from Vertex AI response");
    }
    const raw = result.response.candidates[0].content.parts[0].text;
    console.log("Received raw response from Vertex AI:", raw);
    // --- END MODIFIED ---

    let response = { mood: "neutral", reply: "Sorry, I had trouble thinking." };

    try {
      response = JSON.parse(raw);
    } catch (err) {
      console.error("Vertex AI JSON parse fail:", err, raw);
      // Fallback
      response.reply = raw.trim();
    }
    console.log("Parsed AI response:", response);

    // Firestore save logic (UNCHANGED)
    const now = admin.firestore.FieldValue.serverTimestamp();
    console.log("Saving messages to Firestore...");
    await db.collection("ai-chats").doc().set({ userId, sender: "user", text: message, timestamp: now });
    await db.collection("ai-chats").doc().set({ userId, sender: "ai", text: response.reply, mood: response.mood, timestamp: now });
    console.log("Messages saved successfully.");

    return res.status(200).json(response);

  } catch (err: unknown) {
    console.error("API Error:", err); // Log the full error

    // More detailed error logging
    if (err instanceof Error) {
        console.error("Error Message:", err.message);
        console.error("Error Stack:", err.stack);
    } else {
        console.error("Unknown error object:", err);
    }

    res.status(500).json({ error: "Internal server error" });
  }
}