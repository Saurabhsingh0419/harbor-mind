
check this safe--harbor.vercel.app

Harbor Mind - Student Mental Wellness Application
Harbor Mind is a supportive digital space designed to promote mental wellness and provide psychological support for students. This application offers a range of tools and resources to help students manage stress, understand their mental health, and access help when needed.

Key Features
Wellness Check-in: A guided questionnaire to help students reflect on their current emotional state and track their well-being over time.

AI Companion: An interactive AI chat feature for immediate support and conversation.

Resource Library: A curated collection of articles, videos, and guided exercises on various mental health topics, including stress management, anxiety, and mindfulness.

Professional Support: Information and easy access to university counselors and crisis hotlines for immediate and professional help.

Personalized Recommendations: Based on the wellness check-in, the application provides tailored suggestions for resources and next steps.

Technologies Used
Vite: A fast and modern build tool for web development.

React: A JavaScript library for building user interfaces.

TypeScript: A statically typed superset of JavaScript that adds type safety.

Tailwind CSS: A utility-first CSS framework for rapid UI development.

Shadcn UI: A collection of re-usable UI components.

Getting Started
To get a local copy up and running, follow these simple steps.

Prerequisites
Node.js (v18 or higher recommended)

npm (or yarn/pnpm)

Installation & Setup
Clone the repository:

Bash

git clone https://github.com/your-username/harbor-mind.git
Navigate to the project directory:

Bash

cd harbor-mind
Install dependencies:

Bash

npm install
Start the development server:

Bash

npm run dev
The application will be available at http://localhost:8080.

Available Scripts
In the project directory, you can run:

npm run dev: Runs the app in development mode.

npm run build: Builds the app for production to the dist folder.

npm run lint: Lints the code to find and fix problems.

npm run preview: Serves the production build locally for preview.

Project Structure
The project follows a standard Vite + React structure:

/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # Reusable UI components
│   │   ├── ui/          # Shadcn UI components
│   │   └── ...
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   ├── pages/           # Page components for routing
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Entry point of the application
├── package.json         # Project dependencies and scripts
└── ...
Contributing
Contributions are welcome! If you have suggestions for improving the application, please open an issue or submit a pull request.

Deployment
To deploy the application, you can use any static site hosting service like Vercel, Netlify, or GitHub Pages. Run npm run build to create a production-ready build in the dist/ directory, and then deploy the contents of that directory.
