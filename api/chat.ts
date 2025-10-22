// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  VertexAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google-cloud/vertexai";
import admin from "firebase-admin";

// --- START OF UPDATED SETUP CODE ---

// Check required environment variables
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
    // Log only the start/end to confirm it's loaded without exposing the key
    console.log('VERTEX_PRIVATE_KEY environment variable found (starts with: ' + process.env.VERTEX_PRIVATE_KEY.substring(0, 30) + '...).');
}


let vertex_ai;
try {
    // Initialize Vertex AI using individual credential components
    vertex_ai = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID!,
      location: 'us-central1', // Or your preferred region
      // Provide credentials directly from separate env vars
      credentials: {
          client_email: process.env.VERTEX_CLIENT_EMAIL!,
          // IMPORTANT: Replace escaped newlines from the JSON back to actual newlines for the library
          private_key: process.env.VERTEX_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }
    });
    console.log('VertexAI client initialized successfully using separate credentials.');
} catch (initError) {
    console.error("CRITICAL: Failed to initialize VertexAI client:", initError);
    throw new Error('Server configuration error: VertexAI client initialization failed.');
}

// ... (rest of the setup code: safetySettings, modelInstance remains the same) ...
const safetySettings = [
    // ... (keep your existing safety settings) ...
];
const modelInstance = vertex_ai.getGenerativeModel({
  model: "gemini-1.5-flash-001",
  safetySettings,
  generationConfig: {
     responseMimeType: "application/json",
  },
});
console.log('Generative model instance created.');

// --- END OF UPDATED SETUP CODE ---


// --- FIREBASE ADMIN SETUP (UNCHANGED) ---
// ... (keep your existing Firebase Admin init code) ...
const db = admin.firestore();


// --- SYSTEM PROMPT (UNCHANGED) ---
// ... (keep your existing system prompt) ...


// --- HANDLER FUNCTION (UNCHANGED) ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // ... (keep your existing handler function code) ...
}