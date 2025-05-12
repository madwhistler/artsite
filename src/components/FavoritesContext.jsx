import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, setDoc, getDoc, arrayUnion, arrayRemove, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from './AuthContext';

// Create context
const FavoritesContext = createContext();

// Storage key for local storage
const STORAGE_KEY = 'favoriteArtworks';

export const FavoritesProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [favorites, setFavorites] = useState(() => {
        const storedFavorites = localStorage.getItem(STORAGE_KEY);
        return storedFavorites ? new Set(JSON.parse(storedFavorites)) : new Set();
    });
    const [initialized, setInitialized] = useState(false);

    // Fetch user favorites from Firebase on auth state change
    useEffect(() => {
        const fetchUserFavorites = async () => {
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    if (userDoc.exists() && userDoc.data().favorites) {
                        // Merge with local favorites
                        const cloudFavorites = userDoc.data().favorites;
                        const localFavorites = Array.from(favorites);
                        const mergedFavorites = new Set([...localFavorites, ...cloudFavorites]);

                        setFavorites(mergedFavorites);
                        // Save merged favorites back to cloud
                        if (localFavorites.length > 0) {
                            await updateDoc(doc(db, 'users', currentUser.uid), {
                                favorites: Array.from(mergedFavorites)
                            });
                        }
                    } else if (favorites.size > 0) {
                        // If user doesn't have cloud favorites yet, save local ones
                        await setDoc(doc(db, 'users', currentUser.uid), {
                            favorites: Array.from(favorites)
                        }, { merge: true });
                    }
                } catch (error) {
                    console.error('Error fetching favorites:', error);
                }
            } else {
                // If no user is logged in, clear favorites from localStorage
                localStorage.removeItem(STORAGE_KEY);
                setFavorites(new Set());
            }
            setInitialized(true);
        };

        fetchUserFavorites();
    }, [currentUser]);

    // Update localStorage whenever favorites change (after initialization)
    useEffect(() => {
        if (initialized) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(favorites)));
        }
    }, [favorites, initialized]);

    // Save to Firebase when favorites change for authenticated users
    useEffect(() => {
        const syncToFirebase = async () => {
            if (initialized && currentUser && favorites.size > 0) {
                try {
                    await setDoc(doc(db, 'users', currentUser.uid), {
                        favorites: Array.from(favorites)
                    }, { merge: true });
                } catch (error) {
                    console.error('Error syncing favorites to Firebase:', error);
                }
            }
        };

        syncToFirebase();
    }, [favorites, currentUser, initialized]);

    // Toggle favorite status
    const toggleFavorite = async (artworkId) => {
        setFavorites(prev => {
            const newFavorites = new Set(prev);
            if (newFavorites.has(artworkId)) {
                newFavorites.delete(artworkId);
                // If user is authenticated, update Firebase
                if (currentUser) {
                    try {
                        updateDoc(doc(db, 'users', currentUser.uid), {
                            favorites: arrayRemove(artworkId)
                        });
                    } catch (error) {
                        console.error('Error removing favorite from Firebase:', error);
                    }
                }
            } else {
                newFavorites.add(artworkId);
                // If user is authenticated, update Firebase
                if (currentUser) {
                    try {
                        updateDoc(doc(db, 'users', currentUser.uid), {
                            favorites: arrayUnion(artworkId)
                        });
                    } catch (error) {
                        console.error('Error adding favorite to Firebase:', error);
                    }
                }
            }
            return newFavorites;
        });
    };

    // Check if an artwork is favorited
    const isFavorite = (artworkId) => {
        return favorites.has(artworkId);
    };

    // Get all favorites
    const getAllFavorites = () => {
        return Array.from(favorites);
    };

    return (
        <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, getAllFavorites }}>
            {children}
        </FavoritesContext.Provider>
    );
};

// Custom hook for using the favorites context
export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
};
