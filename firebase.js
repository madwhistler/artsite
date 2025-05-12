import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDKsVUpzVhQWCV8ECH0qYqc25ouYrl9DoY",
    authDomain: "haven-artsite.firebaseapp.com",
    projectId: "haven-artsite",
    storageBucket: "default-bucket",
    messagingSenderId: "583444959978",
    appId: "1:583444959978:web:c49ffc5637a372835e7d93"
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, 'us-central1');
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);
const storage = getStorage(app);

// Check if we're in development mode and should use emulators
const useEmulator = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true';

console.log('Environment:', {
    isDev: import.meta.env.DEV,
    useEmulatorFlag: import.meta.env.VITE_USE_EMULATOR,
    willUseEmulator: useEmulator
});

if (useEmulator) {
    console.log('Connecting to Firebase emulators...');
    connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    connectDatabaseEmulator(database, '127.0.0.1', 9000);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    console.log('Storage emulator connected at 127.0.0.1:9199');
} else {
    console.log('Using production Firebase services');
}

export { app, auth, db, functions, database, storage };
