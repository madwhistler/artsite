import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDKsVUpzVhQWCV8ECH0qYqc25ouYrl9DoY",
    authDomain: "haven-artsite.firebaseapp.com",
    projectId: "haven-artsite",
    storageBucket: "haven-artsite.firebasestorage.app",
    messagingSenderId: "583444959978",
    appId: "1:583444959978:web:c49ffc5637a372835e7d93"
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, 'us-central1');
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);

// Check if we're in development mode and should use emulators
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
    console.log('Connecting to emulators...');
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    connectDatabaseEmulator(database, 'localhost', 9000);
}

export { app, auth, db, functions, database };
