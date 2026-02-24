# AXEN AI Academy - Complete Guide

## Overview

AXEN AI Academy is a production-grade, scalable Progressive Web Application for learning AI Engineering and AI/ML engineering skills through hands-on interactive tools.

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

### Frontend
- **Framework**: Next.js 15
- **UI Library**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Backend & Services
- **Backend**: Firebase (Firestore, Auth, Storage)
- **AI/LLM**: Google Gemini API
- **Charts**: Recharts, Chart.js, React Chart.js 2

### Additional Libraries
- **Machine Learning**: TensorFlow.js, TensorFlow Models (COCO-SSD, MobileNet)
- **Data Processing**: PapaParse (CSV), XLSX (Excel), jsPDF
- **Utilities**: Axios, date-fns, PDF.js

## Project Structure

```
/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Main dashboard routes
│   ├── admin/             # Admin panel routes
│   ├── learning/          # Learning hub routes
│   ├── 3d-simulators/     # 3D simulator routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   ├── features/          # Feature-specific components
│   ├── layout/            # Layout components
│   └── admin/             # Admin components
├── contexts/              # React contexts (theme, auth, etc.)
├── lib/                   # Utilities and configurations
│   ├── firebase/          # Firebase setup
│   ├── services/          # Service layer (admin, learning progress, etc.)
│   └── utils/             # Helper functions
├── types/                 # TypeScript type definitions
└── public/                # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account (optional - app works in demo mode without Firebase)
- Google Gemini API key (optional, for AI Mentor feature)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Run in Demo Mode (No Setup Required)

The app works completely without Firebase using localStorage:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Demo Mode Features:**
- ✅ User sign up/sign in (localStorage)
- ✅ User profiles
- ✅ XP and level tracking
- ✅ Badges and achievements
- ✅ All UI features
- ✅ Theme switching
- ✅ Navigation

### Step 3: Firebase Setup (Optional)

When you're ready to add Firebase for cloud sync and persistence:

#### 3.1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `axen-platform` (or any name you prefer)
4. Click **Continue**
5. **Disable** Google Analytics (optional, or enable if you want)
6. Click **Create project**
7. Wait for project creation to complete
8. Click **Continue**

#### 3.2: Enable Authentication

1. In Firebase Console, click **Authentication** in the left sidebar
2. Click **Get started**
3. Click on **Sign-in method** tab
4. Enable **Email/Password**:
   - Click on "Email/Password"
   - Toggle **Enable** to ON
   - Click **Save**
5. Enable **Google**:
   - Click on "Google"
   - Toggle **Enable** to ON
   - Enter a project support email (your email)
   - Click **Save**

#### 3.3: Create Firestore Database

1. Click **Firestore Database** in the left sidebar
2. Click **Create database**
3. Select **Start in production mode** (we'll add rules later)
4. Choose a location (select closest to your users)
5. Click **Enable**

#### 3.4: Get Firebase Configuration

1. Click the **gear icon** (⚙️) next to "Project Overview" at the top
2. Click **Project settings**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** (`</>`) to add a web app
5. Register app:
   - App nickname: `AXEN Platform` (or any name)
   - **DO NOT** check "Also set up Firebase Hosting"
   - Click **Register app**
6. Copy your Firebase configuration values

#### 3.5: Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

**Important**: 
- Replace all values with YOUR actual Firebase config values
- Do NOT include quotes around the values
- Make sure there are no spaces around the `=` sign
- Never commit `.env.local` to git (it's in .gitignore)

#### 3.6: Set Up Firestore Security Rules

1. In Firebase Console, go to **Firestore Database**
2. Click on **Rules** tab
3. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && 
        (request.auth.uid == userId || isAdmin());
      allow delete: if isAdmin();
    }
    
    // Courses collection
    match /courses/{courseId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // Projects collection
    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        (request.auth.uid == resource.data.userId || isAdmin()) ||
        (
          request.resource.data.upvotes is int &&
          request.resource.data.upvotedUsers is list &&
          request.resource.data.comments is int &&
          request.resource.data.userId == resource.data.userId &&
          request.resource.data.title == resource.data.title &&
          request.resource.data.description == resource.data.description
        )
      );
      allow delete: if request.auth != null &&
        (request.auth.uid == resource.data.userId || isAdmin());
      
      // Comments subcollection
      match /comments/{commentId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow update, delete: if request.auth != null &&
          (request.auth.uid == resource.data.userId || isAdmin());
      }
    }
    
    // Quizzes collection
    match /quizzes/{quizId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    
    // FAQ collection
    match /faq/{faqId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
  }
}
```

4. Click **Publish**

#### 3.7: Add Authorized Domains

1. Go to **Authentication** > **Settings** tab
2. Scroll to **Authorized domains**
3. Make sure `localhost` is listed (it should be by default)
4. If deploying, add your production domain

#### 3.8: Create Admin User

1. Sign up through the app (create a normal user account)
2. Go to Firebase Console > **Firestore Database**
3. Click on **users** collection
4. Find your user document (by your email or UID)
5. Click on the document
6. Add a new field:
   - Field: `role`
   - Type: `string`
   - Value: `admin`
7. Click **Update**

#### 3.9: Restart Development Server

1. Stop your current dev server (Ctrl+C)
2. Run again:
   ```bash
   npm run dev
   ```

The app will automatically detect Firebase configuration and switch to Firebase mode.

### Step 4: Gemini API Setup (Optional)

The AI Mentor Chatbot requires a Gemini API key. Other features work without it.

#### 4.1: Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the API key

#### 4.2: Add to Environment Variables

Add to your `.env.local` file:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

#### 4.3: Restart Server

Restart the development server for changes to take effect.

#### 4.4: Test API Key

You can test your API key directly:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Build and deploy to Firebase Hosting
npm run deploy
```

### Data Storage Modes

**Demo Mode (No Firebase):**
- Data stored in `localStorage`
- Persists between sessions
- Cleared if browser data is cleared
- Perfect for development and testing

**Firebase Mode (When Configured):**
- Data stored in Firestore
- Cloud sync
- Persistent across devices
- Production-ready

The app automatically detects which mode to use based on Firebase configuration.

## Features Checklist

- ✅ Authentication (Google Sign-In, Email/Password)
- ✅ Theme System (5 themes)
- ✅ Dashboard with Analytics
- ✅ Learning Hub (courses with modules and topics)
- ✅ Code Simulator
- ✅ Project Lab with AI Review
- ✅ AI Mentor Chatbot (requires Gemini API)
- ✅ Career Compass
- ✅ Admin Panel
- ✅ Leaderboard
- ✅ Gamification (XP, Badges, Levels)
- ✅ PWA Support
- ✅ Responsive Design
- ✅ 3D Simulators (Neural Networks, etc.)

## Neural Network Playground Simulator

The app includes an interactive Neural Network Playground simulator for training and visualizing neural networks entirely in the browser using TensorFlow.js.

### Features

- **Interactive Training**: Train neural networks in real-time with visual feedback
- **Multiple Datasets**: Pre-built datasets (Linear, Circles, Moons, Spiral) or upload your own CSV/Excel files
- **Customizable Architecture**: Configure hidden layers, neurons per layer, and activation functions
- **Real-time Visualization**: Watch decision boundaries update as the model trains
- **Training Metrics**: Monitor loss and accuracy with interactive charts
- **Model Download**: Save trained models for later use
- **No Backend Required**: Everything runs client-side using TensorFlow.js

### Required Packages

The following packages are already included in the project:

```bash
@tensorflow/tfjs react-chartjs-2 chart.js papaparse xlsx framer-motion lucide-react
```

### Usage

The simulator is automatically integrated into the app. Navigate to a deep learning topic to access it.

## Troubleshooting

### Firebase Auth Issues

- Ensure Firebase Authentication is enabled
- Check that authorized domains include localhost
- Verify environment variables are correct
- Restart dev server after adding `.env.local`

### Error: "auth/invalid-api-key"

- Make sure `.env.local` file exists in project root
- Verify all environment variables are correct
- Restart the dev server after adding `.env.local`
- Check for typos in variable names

### Error: "Firebase is not configured"

- Check that `.env.local` file exists
- Verify all variables start with `NEXT_PUBLIC_`
- Make sure no quotes around values
- Restart dev server

### Google Sign-In not working

- Verify Google provider is enabled in Authentication
- Check authorized domains include localhost
- Make sure support email is set

### Firestore permission denied

- Check security rules are published
- Verify user is authenticated
- Check document structure matches rules

### Gemini API Issues

- AI Mentor requires Gemini API key
- Without API key, chatbot will show error messages
- Other features work without Gemini API
- Verify API key at Google AI Studio
- Restart server after adding API key

### Build Errors

- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### TensorFlow.js Not Loading

- Check browser console for errors
- Ensure you have a stable internet connection (first load downloads TensorFlow.js)
- Try clearing browser cache

## Production Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Firebase Hosting

```bash
npm run deploy
```

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Security Notes

- Never commit `.env.local` to git (it's in .gitignore)
- Keep your Firebase config secret
- Review security rules regularly
- Use Firebase Console to monitor usage
- Rotate API keys periodically

## Next Steps

1. Customize course content in Firestore (or use admin panel)
2. Add more learning modules
3. Configure AI auto-reviewer prompts
4. Set up production deployment
5. Add custom branding and logos
6. Configure analytics (if needed)

## Support

For issues or questions, please refer to this guide or contact the development team.

## License

ISC
