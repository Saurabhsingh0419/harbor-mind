Harbor Mind - Student Mental Wellness Application 🌊

Live Demo: https://harbor-mind.vercel.app/

Harbor Mind is a supportive digital space designed to promote mental wellness and provide psychological support for students. This application offers a range of tools and resources to help students manage stress, understand their mental health, and access help when needed.

✨ Key Features

Wellness Check-in: Reflect on your emotional state and track well-being over time.

AI Companion: An interactive AI chat (powered by Google Gemini) for immediate support and conversation.

Resource Library: Curated articles, videos, guided exercises, and interactive tools (CBT Journal, Mood Journal, Goal Planner).

Professional Support: Easy access to crisis hotlines for immediate help.

Personalized Recommendations: Tailored suggestions based on check-ins.

🛠️ Technologies Used

Frontend: Vite, React, TypeScript, Tailwind CSS, Shadcn UI

Backend: Firebase (Authentication, Firestore Realtime Database)

AI: Google Gemini API (via Vercel Serverless Function)

Deployment: Vercel

🚀 Getting Started Locally

Prerequisites:

Node.js (v18+)

npm / yarn / pnpm

Setup:

Clone the repository:

git clone [https://github.com/Saurabhsingh0419/harbor-mind.git](https://github.com/Saurabhsingh0419/harbor-mind.git) 
cd harbor-mind


Install dependencies:

npm install


Set up Environment Variables:

Create a .env.local file in the project root.

Add your Firebase client keys (prefixed with VITE_) and your Google Gemini API key (named GEMINI_API_KEY). Refer to Firebase and Google AI Studio documentation for obtaining these.

Add Firebase Admin SDK keys (service account email and private key) for the backend API.

Run the development server (using Vercel CLI to include the API):

npm install -g vercel # If you don't have it installed
vercel dev


The application will be available at http://localhost:XXXX (Vercel CLI will specify the port).

📜 Available Scripts

npm run dev: Starts the Vite development server (frontend only).

npm run build: Creates a production build in dist/.

npm run lint: Lints the code.

npm run preview: Serves the production build locally.

vercel dev: Runs both frontend and the serverless API locally (recommended).

🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

(Deployment)

This project is deployed on Vercel. Connect your GitHub repository to Vercel for automatic deployments on push. Ensure all necessary environment variables (Firebase keys, Gemini API key, etc.) are configured in your Vercel project settings.
