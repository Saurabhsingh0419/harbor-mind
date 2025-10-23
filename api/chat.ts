// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { // Import from the standard Gemini SDK
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import admin from "firebase-admin";

// --- START OF GEMINI API SETUP ---

// Check required Gemini API Key
if (!process.env.GEMINI_API_KEY) {
  console.error('CRITICAL: GEMINI_API_KEY environment variable is not set!');
  throw new Error('Server configuration error: Missing Gemini API Key.');
} else {
  console.log('GEMINI_API_KEY environment variable found.');
}

let genAI;
try {
  // Initialize GoogleGenerativeAI with the API key
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('GoogleGenerativeAI client initialized successfully.');
} catch (initError) {
  console.error("CRITICAL: Failed to initialize GoogleGenerativeAI client:", initError);
  throw new Error('Server configuration error: GoogleGenerativeAI client initialization failed.');
}

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Get the generative model instance using a model compatible with the Gemini API (Generative Language API)
// Using 'gemini-1.5-flash-latest' which supports JSON mode
const modelInstance = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
  safetySettings,
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.7, // Optional: Adjust creativity
    // maxOutputTokens: 1024, // Optional: Limit response length
  },
});
console.log(`Generative model instance created for model: ${modelInstance.model}`);

// --- END OF GEMINI API SETUP ---


// --- START OF ROBUST FIREBASE ADMIN SETUP ---
// (Keep the robust Firebase Admin setup from previous steps)
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error('Missing required Firebase environment variables.');
}
console.log('All required Firebase environment variables found.');

let db: admin.firestore.Firestore;
try {
  if (!admin.apps.length) {
    console.log("Initializing Firebase Admin SDK...");
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
    });
    console.log("Firebase Admin Initialized Successfully.");
    db = admin.firestore();
    console.log("Firestore instance created.");
  } else {
      console.log("Firebase Admin already initialized.");
      db = admin.firestore();
      console.log("Firestore instance retrieved from existing app.");
  }
} catch (error) {
  console.error("CRITICAL: Firebase Admin Initialization Error:", error);
  throw new Error('Server configuration error: Firebase Admin SDK initialization failed.');
}
if (!db) {
    console.error("CRITICAL: Firestore database instance is not available post-init.");
    throw new Error('Server configuration error: Firestore initialization failed post-init.');
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


// --- HANDLER FUNCTION ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("API Handler started");

  if (!db) {
      console.error("Handler Error: Firestore DB not initialized.");
      return res.status(500).json({ error: "Internal server configuration error." });
  }
  if (!modelInstance) {
      console.error("Handler Error: Gemini Model not initialized.");
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
    if (!message?.trim()) { // Added trim check
        console.log("Bad Request: Missing or empty message");
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
    console.log("Constructed full prompt for Gemini.");

    console.log(`Calling Gemini generateContent with model ${modelInstance.model}...`);
    // Call the standard Gemini API SDK
    const result = await modelInstance.generateContent(fullPrompt);
    const generationResponse = result.response; // Get the response object

    const responseText = generationResponse.text(); // Use the text() method
    if (!responseText) {
        console.error("Unexpected Gemini response structure:", JSON.stringify(generationResponse, null, 2));
         // Check if it was blocked
        if (generationResponse.promptFeedback?.blockReason) {
            console.error("Response blocked due to:", generationResponse.promptFeedback.blockReason);
             return res.status(400).json({ error: `Request blocked by safety filters: ${generationResponse.promptFeedback.blockReason}` });
        }
        throw new Error("No text content found in Gemini response");
    }
    console.log("Received raw response from Gemini:", responseText);

    let response = { mood: "neutral", reply: "Sorry, I had trouble thinking." };
    try {
      response = JSON.parse(responseText); // Should work due to responseMimeType
    } catch (err) {
      console.error("Gemini JSON parse fail:", err, responseText);
      // Fallback: try to extract JSON manually if wrapped
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
            response = JSON.parse(jsonMatch[0]);
        } catch (innerErr) {
            console.error("Manual JSON extraction failed:", innerErr);
            response.reply = responseText.trim(); // Use raw text as fallback
        }
      } else {
        response.reply = responseText.trim(); // Use raw text as fallback
      }
    }
    console.log("Parsed AI response:", response);

    const now = admin.firestore.FieldValue.serverTimestamp();
    console.log("Saving messages to Firestore...");
    // Changed to addDoc for simplicity, ensures unique IDs
    await db.collection("ai-chats").add({ userId, sender: "user", text: message, timestamp: now });
    await db.collection("ai-chats").add({ userId, sender: "ai", text: response.reply, mood: response.mood, timestamp: now });
    console.log("Messages saved successfully.");

    return res.status(200).json(response);

  } catch (err: unknown) {
    console.error("--- API Handler Error ---");
    console.error("Timestamp:", new Date().toISOString());

    if (err instanceof Error) {
        console.error("Error Type:", err.name);
        console.error("Error Message:", err.message);
        console.error("Error Stack:", err.stack);
        // Check for common Gemini API errors (like invalid key or model not found)
        if (err.message.includes("API key not valid") || err.message.includes("API_KEY_INVALID")) {
             console.error(">>> Gemini API Key Error! Check GEMINI_API_KEY in Vercel. <<<");
        } else if (err.message.includes("is not found") && err.message.includes("models/")) {
             console.error(`>>> Gemini Model Not Found! Check model name used: "${modelInstance.model}" and project/API key permissions. <<<`);
        } else if (err.message.includes("permission") || err.message.includes("PermissionDenied")) {
             console.error(">>> Gemini API Permission Denied! Check Google Cloud project settings and API key restrictions. <<<");
        } else if (err.message.includes(" Billing account ")) {
             console.error(">>> Gemini API Billing Error! Ensure billing is enabled on the Google Cloud project. <<<");
        }

    } else {
        console.error("Unknown error object:", err);
    }
    console.error("--- End API Handler Error ---");

    res.status(500).json({ error: "Internal server error" });
  }
}