import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Create context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // If user profile doesn't have displayName but we have it in Firestore
                if (!user.displayName) {
                    try {
                        const userDoc = await getDoc(doc(db, 'users', user.uid));
                        if (userDoc.exists() && userDoc.data().firstName) {
                            // Update the user profile
                            await updateProfile(user, {
                                displayName: userDoc.data().firstName
                            });
                            // Use the updated user
                            setCurrentUser({
                                ...user,
                                displayName: userDoc.data().firstName
                            });
                        } else {
                            setCurrentUser(user);
                        }
                    } catch (error) {
                        console.error("Error fetching user data:", error);
                        setCurrentUser(user);
                    }
                } else {
                    setCurrentUser(user);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Register a new user
    const register = async (email, password, firstName) => {
        try {
            setAuthError(null);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update profile with firstName as displayName
            await updateProfile(user, {
                displayName: firstName
            });

            // Store additional user info in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email,
                firstName,
                createdAt: new Date(),
                lastLogin: new Date()
            });

            return user;
        } catch (error) {
            console.error("Error registering user:", error);
            setAuthError(getReadableErrorMessage(error.code));
            throw error;
        }
    };

    // Sign in an existing user
    const login = async (email, password) => {
        try {
            setAuthError(null);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update lastLogin in Firestore
            try {
                await setDoc(doc(db, 'users', user.uid), {
                    lastLogin: new Date()
                }, { merge: true });
            } catch (error) {
                console.error("Error updating last login:", error);
            }

            return user;
        } catch (error) {
            console.error("Error logging in:", error);
            setAuthError(getReadableErrorMessage(error.code));
            throw error;
        }
    };

    // Sign out
    const logout = async () => {
        try {
            setAuthError(null);
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
            setAuthError(getReadableErrorMessage(error.code));
            throw error;
        }
    };

    // Convert Firebase error codes to readable messages
    const getReadableErrorMessage = (errorCode) => {
        switch (errorCode) {
            case 'auth/email-already-in-use':
                return 'This email is already being used by another account.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                return 'Invalid email or password.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters.';
            case 'auth/too-many-requests':
                return 'Too many unsuccessful login attempts. Please try again later.';
            default:
                return 'An error occurred. Please try again.';
        }
    };

    const value = {
        currentUser,
        register,
        login,
        logout,
        authError,
        setAuthError,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// Custom hook for using the auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};



