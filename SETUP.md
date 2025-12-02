# AXEN Platform Setup Guide

## Prerequisites

- Node.js 18+ and npm
- Firebase account
- Google Gemini API key (optional, for AI Mentor feature)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Google Sign-In
   - Enable Email/Password
4. Create Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules (see below)
5. Get your Firebase config:
   - Go to Project Settings > General
   - Scroll down to "Your apps"
   - Add a web app if you haven't
   - Copy the Firebase configuration

## Step 3: Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

## Step 4: Firestore Security Rules

Set up Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
    }
    
    // Projects collection
    match /projects/{projectId} {
      allow read: if resource.data.isPublic == true || request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Modules collection
    match /modules/{moduleId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Admin-only collections
    match /admin/{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Step 5: Create Admin User

After signing up, manually set a user's role to 'admin' in Firestore:

1. Go to Firestore Database
2. Find the `users` collection
3. Open the user document
4. Add or update the `role` field to `"admin"`

## Step 6: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 7: Build for Production

```bash
npm run build
npm start
```

## Features Checklist

- ✅ Authentication (Google Sign-In, Email/Password)
- ✅ Theme System (5 themes)
- ✅ Dashboard with Analytics
- ✅ Learning Hub (2 courses with modules)
- ✅ Code Simulator
- ✅ Project Lab with AI Review
- ✅ AI Mentor Chatbot (requires Gemini API)
- ✅ Career Compass
- ✅ Admin Panel
- ✅ Leaderboard
- ✅ Gamification (XP, Badges, Levels)
- ✅ PWA Support
- ✅ Responsive Design

## Troubleshooting

### Firebase Auth Issues
- Ensure Firebase Authentication is enabled
- Check that authorized domains include localhost
- Verify environment variables are correct

### Gemini API Issues
- AI Mentor requires Gemini API key
- Without API key, chatbot will show error messages
- Other features work without Gemini API

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Next Steps

1. Customize course content in Firestore
2. Add more learning modules
3. Configure AI auto-reviewer prompts
4. Set up production deployment (Vercel, Firebase Hosting, etc.)
5. Add custom branding and logos

