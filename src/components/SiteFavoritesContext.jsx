import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useFavorites } from './FavoritesContext';

// Create context
const SiteFavoritesContext = createContext();

export const SiteFavoritesProvider = ({ children }) => {
    const { favorites } = useFavorites();
    const [siteFavorites, setSiteFavorites] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all users' favorites from Firestore and listen for changes
    useEffect(() => {
        setLoading(true);
        console.log('Setting up real-time listener for site favorites');

        // Set up a real-time listener for the users collection
        const unsubscribe = onSnapshot(
            collection(db, 'users'),
            (snapshot) => {
                // Initialize a counter object for artwork IDs
                const favoriteCounts = {};

                // Count favorites across all users
                snapshot.forEach((userDoc) => {
                    const userData = userDoc.data();
                    if (userData.favorites && Array.isArray(userData.favorites)) {
                        userData.favorites.forEach(artworkId => {
                            favoriteCounts[artworkId] = (favoriteCounts[artworkId] || 0) + 1;
                        });
                    }
                });

                setSiteFavorites(favoriteCounts);
                setLoading(false);
                console.log('Updated site favorites:', Object.keys(favoriteCounts).length, 'artworks');
            },
            (err) => {
                console.error('Error fetching site favorites:', err);
                setError('Failed to load site favorites');
                setLoading(false);
            }
        );

        // Clean up the listener when the component unmounts
        return () => unsubscribe();
    }, []);

    // Get favorite count for a specific artwork
    const getFavoriteCount = (artworkId) => {
        return siteFavorites[artworkId] || 0;
    };

    // Get all artwork IDs sorted by popularity
    const getPopularArtworkIds = () => {
        return Object.entries(siteFavorites)
            .sort(([_, countA], [__, countB]) => countB - countA)
            .map(([id, _]) => id);
    };

    return (
        <SiteFavoritesContext.Provider
            value={{
                siteFavorites,
                loading,
                error,
                getFavoriteCount,
                getPopularArtworkIds
            }}
        >
            {children}
        </SiteFavoritesContext.Provider>
    );
};

// Custom hook for using the site favorites context
export const useSiteFavorites = () => {
    const context = useContext(SiteFavoritesContext);
    if (!context) {
        throw new Error('useSiteFavorites must be used within a SiteFavoritesProvider');
    }
    return context;
};
