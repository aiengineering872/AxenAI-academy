/**
 * Script to delete "AI Engineering" course from Firestore
 * Run with: node scripts/delete-ai-engineering-course.js
 * 
 * Make sure you have your Firebase credentials set up in .env.local
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, deleteDoc, doc } = require('firebase/firestore');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function deleteAICourse() {
  try {
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('Searching for "AI Engineering" course...');
    
    // Find the course by ID
    const courseId = 'ai-engineering';
    const courseRef = doc(db, 'courses', courseId);
    
    // Check if course exists and delete it
    try {
      await deleteDoc(courseRef);
      console.log(`✅ Successfully deleted course: ${courseId}`);
    } catch (error) {
      if (error.code === 'not-found') {
        console.log(`ℹ️  Course ${courseId} not found in Firestore (may already be deleted)`);
      } else {
        throw error;
      }
    }

    // Also delete all modules associated with this course
    console.log('Searching for modules associated with this course...');
    const modulesQuery = query(collection(db, 'modules'), where('courseId', '==', courseId));
    const modulesSnapshot = await getDocs(modulesQuery);
    
    if (modulesSnapshot.empty) {
      console.log('ℹ️  No modules found for this course');
    } else {
      console.log(`Found ${modulesSnapshot.size} module(s) to delete...`);
      for (const moduleDoc of modulesSnapshot.docs) {
        const moduleId = moduleDoc.id;
        
        // Delete lessons for this module
        const lessonsQuery = query(collection(db, 'lessons'), where('moduleId', '==', moduleId));
        const lessonsSnapshot = await getDocs(lessonsQuery);
        
        for (const lessonDoc of lessonsSnapshot.docs) {
          await deleteDoc(doc(db, 'lessons', lessonDoc.id));
          console.log(`  Deleted lesson: ${lessonDoc.id}`);
        }
        
        // Delete the module
        await deleteDoc(doc(db, 'modules', moduleId));
        console.log(`  Deleted module: ${moduleId}`);
      }
      console.log('✅ All associated modules and lessons deleted');
    }

    console.log('\n✅ Cleanup complete!');
    console.log('Note: User progress data in localStorage/Firestore will remain but won\'t affect the app.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteAICourse();

