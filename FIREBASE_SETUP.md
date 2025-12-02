# Firebase Setup Guide - Step by Step

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `axen-platform` (or any name you prefer)
4. Click **Continue**
5. **Disable** Google Analytics (optional, or enable if you want)
6. Click **Create project**
7. Wait for project creation to complete
8. Click **Continue**

## Step 2: Enable Authentication

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

## Step 3: Create Firestore Database

1. Click **Firestore Database** in the left sidebar
2. Click **Create database**
3. Select **Start in production mode** (we'll add rules later)
4. Choose a location (select closest to your users)
5. Click **Enable**

## Step 4: Get Firebase Configuration

1. Click the **gear icon** (⚙️) next to "Project Overview" at the top
2. Click **Project settings**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** (`</>`) to add a web app
5. Register app:
   - App nickname: `AXEN Platform` (or any name)
   - **DO NOT** check "Also set up Firebase Hosting"
   - Click **Register app**
6. You'll see your Firebase configuration like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456"
   };
   ```
7. **Copy these values** - you'll need them in the next step

## Step 5: Configure Environment Variables

1. In your project root, create a file named `.env.local`
2. Add the following content (replace with YOUR values from Step 4):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

**Important**: 
- Replace all values with YOUR actual Firebase config values
- Do NOT include quotes around the values
- Make sure there are no spaces around the `=` sign

## Step 6: Set Up Firestore Security Rules

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
      // Allow owner/admin to update anything, or any user to update upvotes/upvotedUsers/comments count
      allow update: if request.auth != null && (
        // Owner or admin can update anything
        (request.auth.uid == resource.data.userId || isAdmin()) ||
        // Any authenticated user can update upvotes, upvotedUsers, comments, and updatedAt
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

## Step 7: Add Authorized Domains (for Google Sign-In)

1. Go to **Authentication** > **Settings** tab
2. Scroll to **Authorized domains**
3. Make sure `localhost` is listed (it should be by default)
4. If deploying, add your production domain

## Step 8: Restart Your Development Server

1. Stop your current dev server (Ctrl+C)
2. Run again:
   ```bash
   npm run dev
   ```

## Step 9: Create Your First Admin User

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

## Step 10: Verify Setup

1. Open http://localhost:3000
2. You should see the login page (no errors!)
3. Try signing up with email/password
4. Check Firestore - you should see a new user document
5. Try Google Sign-In (if configured)

## Troubleshooting

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

## Optional: Enable Storage (for file uploads)

1. Go to **Storage** in Firebase Console
2. Click **Get started**
3. Start in production mode
4. Choose location
5. Update security rules if needed

## Next Steps

After setup is complete:
- ✅ Authentication should work
- ✅ Users can sign up/sign in
- ✅ Data saves to Firestore
- ✅ Admin panel accessible (after setting role)
- ✅ All features functional

## Security Notes

- Never commit `.env.local` to git (it's in .gitignore)
- Keep your Firebase config secret
- Review security rules regularly
- Use Firebase Console to monitor usage

