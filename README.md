# AXEN - AI Engineering Learning Platform

A production-grade, scalable Progressive Web Application for learning AI Engineering and AI/ML engineering skills through hands-on interactive tools.

## Features

- 🎓 **Learning Hub** - Interactive courses with modules, lessons, and quizzes
- 💻 **AI Code Simulator** - Integrated code editor with Python execution
- 🚀 **AI Project Lab** - Project showcase with AI auto-reviewer
- 🤖 **AI Mentor Chatbot** - Context-aware learning assistant
- 🧭 **AI Career Compass** - Personalized career roadmap generator
- 👨‍💼 **Admin Panel** - Complete CRUD operations for content management
- 🎮 **Gamification** - XP, badges, leaderboard system
- 🌈 **Multiple Themes** - Dark Navy, Neon Violet, Light, and more dark options
- 📱 **PWA** - Offline support and mobile-first responsive design

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Storage)
- **AI/LLM**: Google Gemini API
- **Animations**: Framer Motion
- **Charts**: Recharts

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up Firebase:
   - Create a Firebase project at https://console.firebase.google.com
   - Copy your Firebase config to `.env.local`

3. Set up environment variables:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Main dashboard routes
│   ├── admin/             # Admin panel routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   ├── features/          # Feature-specific components
│   └── layout/            # Layout components
├── contexts/              # React contexts (theme, auth, etc.)
├── lib/                   # Utilities and configurations
│   ├── firebase/          # Firebase setup
│   └── utils/             # Helper functions
├── types/                 # TypeScript type definitions
└── public/                # Static assets
```

## License

ISC

