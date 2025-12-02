/**
 * Script to delete every module and lesson document from Firestore.
 * Run with: node scripts/delete-all-modules-and-lessons.js
 *
 * Ensure your Firebase credentials are available in .env.local.
 */

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} = require('firebase/firestore');

require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function deleteAllModulesAndLessons() {
  console.log('Initializing Firebase...');
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log('Fetching modules collection...');
  const modulesSnapshot = await getDocs(collection(db, 'modules'));

  if (modulesSnapshot.empty) {
    console.log('ℹ️  No modules found. Skipping module deletion.');
  } else {
    for (const moduleDoc of modulesSnapshot.docs) {
      const moduleId = moduleDoc.id;
      console.log(`\nProcessing module: ${moduleId}`);

      const lessonsQuery = query(collection(db, 'lessons'), where('moduleId', '==', moduleId));
      const lessonsSnapshot = await getDocs(lessonsQuery);

      if (lessonsSnapshot.empty) {
        console.log('  No lessons linked to this module.');
      } else {
        for (const lessonDoc of lessonsSnapshot.docs) {
          await deleteDoc(doc(db, 'lessons', lessonDoc.id));
          console.log(`  Deleted lesson: ${lessonDoc.id}`);
        }
      }

      await deleteDoc(doc(db, 'modules', moduleId));
      console.log(`✅ Deleted module: ${moduleId}`);
    }
  }

  // Cleanup orphan lessons (lessons without a moduleId or already processed)
  console.log('\nChecking for orphan lessons...');
  const remainingLessonsSnapshot = await getDocs(collection(db, 'lessons'));
  if (remainingLessonsSnapshot.empty) {
    console.log('ℹ️  No orphan lessons detected.');
  } else {
    for (const lessonDoc of remainingLessonsSnapshot.docs) {
      await deleteDoc(doc(db, 'lessons', lessonDoc.id));
      console.log(`  Deleted orphan lesson: ${lessonDoc.id}`);
    }
  }

  console.log('\n✅ All modules and lessons have been removed.');
}

deleteAllModulesAndLessons().catch((error) => {
  console.error('❌ Failed to delete modules/lessons:', error);
  process.exit(1);
});


