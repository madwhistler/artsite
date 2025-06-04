// Firebase initialization
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Determine which .env file to load
if (process.env.FUNCTIONS_EMULATOR === 'true') {
  // Load development environment variables
  dotenv.config({ path: path.resolve(__dirname, '.env.development') });
  console.log('Loaded environment variables from .env.development');
} else {
  // Load production environment variables
  dotenv.config({ path: path.resolve(__dirname, '.env') });
  console.log('Loaded environment variables from .env');
}

// Initialize Firebase Admin
let app;
try {
  app = admin.initializeApp();
  console.log('Firebase Admin initialized successfully in firebase-init.js');
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
