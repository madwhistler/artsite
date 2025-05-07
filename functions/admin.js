// Shared Firebase Admin initialization
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.development in development
const __dirname = path.dirname(fileURLToPath(import.meta.url));
if (process.env.FUNCTIONS_EMULATOR === 'true') {
  dotenv.config({ path: path.resolve(__dirname, '.env.development') });
  console.log('Loaded environment variables from .env.development');
}

// Initialize Firebase Admin
let app;
try {
  app = admin.initializeApp();
  console.log('Firebase Admin initialized successfully in admin.js');
} catch (error) {
  console.log('Firebase Admin initialization error:', error.message);
  // If the app is already initialized, get the existing app
  if (error.code === 'app/duplicate-app') {
    app = admin.app();
    console.log('Using existing Firebase Admin app');
  } else {
    throw error;
  }
}

// Export the initialized services
export const db = getFirestore();
export const storage = getStorage();
