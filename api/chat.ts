// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import admin from "firebase-admin";

// --- START OF GEMINI API SETUP ---

if (!process.env.GEMINI_API_KEY) {
  console.error('CRITICAL: GEMINI_API_KEY environment variable is not set!');
  throw new Error('Server configuration error: Missing Gemini API Key.');
} else {
  console.log('GEMINI_API_KEY environment variable found.');
}

let genAI;
try {
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

// --- MODIFICATION: Use 'gemini-2.5-flash' and enable JSON mode ---
const modelInstance = genAI.getGenerativeModel({
  model: "gemini-2.5-flash", // Using the available stable model
  safetySettings,
  generationConfig: {
    responseMimeType: "application/json", // Re-enable JSON mode
    temperature: 0.7,
  },
});
console.log(`Generative model instance created for model: ${modelInstance.model}`);

// --- END OF GEMINI API SETUP ---


// --- START OF ROBUST FIREBASE ADMIN SETUP ---
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error('CRITICAL: Missing required Firebase environment variables.');
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


// --- SYSTEM PROMPT ---
const SYSTEM_PROMPT = `
You are “Safe Harbor AI” — a warm, understanding, and supportive student companion for mental well-being.
Your primary role is to be an empathetic listener and a gentle guide. You are not a licensed therapist, but you can offer supportive advice, well-being strategies, and interactive exercises.

Your conversational flow should follow three steps:
1.  **Validate:** Always start by warmly acknowledging and validating their feelings. Make them feel heard and understood.
2.  **Explore (Gently):** Ask one or two gentle, open-ended questions to understand their situation better. (e.g., "I'm here to listen. Can you tell me a bit more about what's making you feel this way?")
3.  **Guide (When asked):** When the user asks for help (like "what should I do" or "provide steps"), DO NOT just reflect their feelings. This is your cue to offer general, supportive strategies. Your replies should be helpful and conversational.

**Example Advice Strategies:**
* **For Sadness/Breakup:** "That sounds incredibly painful, and it's completely valid to feel heartbroken. Moving on is a process, not a race. A few things that some people find helpful are: 1) Allowing yourself time to grieve—it's okay to be sad. 2) Writing your feelings down in a journal to help process them. 3: Reconnecting with a friend or a hobby you love, even for just a little while. How does one of those sound as a small first step?"
* **For Anxiety/Stress:** "That feeling of being overwhelmed is so tough. Let's see if we can make it feel more manageable. A common first step is to break that big problem down. Can we try to list the top 1 or 2 things that are on your mind right now? We don't have to solve them, just name them."

**Your Style:**
* Be warm, empathetic, and vulnerable.
* **Do not use markdown for emphasis** (like asterisks or underscores). This is very important as it sounds bad when spoken.
* Use commas and full stops to create natural-sounding pauses.

**CRUCIAL SAFETY BOUNDARY:**
* **DO NOT** escalate for general sadness, heartbreak, or stress. Engage and support them.
* **YOU MUST** escalate if the user *explicitly* mentions words like "kill myself," "suicide," "want to die," "no reason to live," or any other clear expression of self-harm. In this *specific* case, your reply must be a gentle but direct reminder to seek professional help.
    * **Crisis Reply Example:** "I hear you, and it sounds like you're in a lot of pain. It's really important to talk to someone who can support you through this right now. Please consider reaching out to a counselor or a crisis hotline like 988."

**Technical Output Format:**
You MUST return ONLY a valid JSON object matching this exact schema:
{"mood":"<oneword_mood>","reply":"<your_full_empathetic_and_helpful_reply_with_no_markdown>"}
`;
// --- END OF PROMPT ---


// --- HANDLER FUNCTION ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("API Handler started");

  if (!db || !modelInstance) {
      console.error("Handler Error: Firestore DB or Gemini Model not initialized.");
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
    // authError may include a `code` property from Firebase; narrow safely
    if (authError instanceof Error) {
      const maybe = authError as Error & { code?: string };
      if (maybe.code === 'auth/id-token-expired') {
        return res.status(401).json({ error: "Token expired, please refresh." });
      }
    }
    return res.status(401).json({ error: "Invalid token" });
  }
    const userId = decodedToken.uid;

    const { message } = req.body;
    if (!message?.trim()) {
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
    const result = await modelInstance.generateContent(fullPrompt);
    const generationResponse = result.response;

    const responseText = generationResponse.text();
    if (!responseText) {
        console.error("Unexpected Gemini response structure:", JSON.stringify(generationResponse, null, 2));
        if (generationResponse.promptFeedback?.blockReason) {
            console.error("Response blocked due to:", generationResponse.promptFeedback.blockReason);
             return res.status(400).json({ error: `Request blocked by safety filters: ${generationResponse.promptFeedback.blockReason}` });
        }
        throw new Error("No text content found in Gemini response");
    }
    console.log("Received raw response from Gemini:", responseText);

    let response = { mood: "neutral", reply: "Sorry, I had trouble thinking." };
    try {
      // Should parse directly due to responseMimeType: "application/json"
      response = JSON.parse(responseText);
    } catch (err) {
      console.error("Gemini JSON parse fail (even with JSON mode):", err, responseText);
      // Fallback just in case JSON mode failed
      response.reply = responseText.trim();
    }
    console.log("Parsed AI response:", response);

    const now = admin.firestore.FieldValue.serverTimestamp();
    console.log("Saving messages to Firestore...");
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
        // Add specific checks for Gemini API errors
        if (err.message.includes("API key not valid") || err.message.includes("API_KEY_INVALID")) {
             console.error(">>> Gemini API Key Error! Check GEMINI_API_KEY in Vercel. <<<");
        } else if (err.message.includes("is not found") && err.message.includes("models/")) {
             console.error(`>>> Gemini Model Not Found! Used: "${modelInstance.model}". Check Google Cloud project permissions/API Key restrictions, or run the curl command again. <<<`);
        } else if (err.message.includes("permission") || err.message.includes("PermissionDenied")) {
             console.error(">>> Gemini API Permission Denied! Check Google Cloud project settings (API enabled?) & API key restrictions. <<<");
        } else if (err.message.includes(" Billing account ")) {
             console.error(">>> Gemini API Billing Error! Ensure billing is enabled on the Google Cloud project. <<<");
        } else if (err.message.includes("RESOURCE_EXHAUSTED")) {
            console.error(">>> Gemini API Rate Limit Exceeded! Check usage limits. <<<");
        }

    } else {
        console.error("Unknown error object:", err);
    }
    console.error("--- End API Handler Error ---");

    res.status(500).json({ error: "Internal server error" });
  }
}