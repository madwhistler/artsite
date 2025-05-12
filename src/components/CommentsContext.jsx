import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    limit, 
    getDocs, 
    addDoc, 
    deleteDoc,
    doc,
    onSnapshot,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from './AuthContext';

// Create context
const CommentsContext = createContext();

export const CommentsProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [comments, setComments] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Set up a real-time listener for comments
    useEffect(() => {
        setLoading(true);
        console.log('Setting up real-time listener for comments');
        
        // Set up a real-time listener for the comments collection
        const unsubscribe = onSnapshot(
            collection(db, 'comments'),
            (snapshot) => {
                // Group comments by artwork ID
                const commentsByArtwork = {};
                
                snapshot.forEach((commentDoc) => {
                    const commentData = commentDoc.data();
                    const artworkId = commentData.artworkId;
                    
                    if (!commentsByArtwork[artworkId]) {
                        commentsByArtwork[artworkId] = [];
                    }
                    
                    commentsByArtwork[artworkId].push({
                        id: commentDoc.id,
                        ...commentData,
                        // Convert Firestore timestamp to JS Date
                        createdAt: commentData.createdAt?.toDate() || new Date()
                    });
                });
                
                // Sort comments by date (newest first) for each artwork
                Object.keys(commentsByArtwork).forEach(artworkId => {
                    commentsByArtwork[artworkId].sort((a, b) => b.createdAt - a.createdAt);
                });
                
                setComments(commentsByArtwork);
                setLoading(false);
                console.log('Updated comments for', Object.keys(commentsByArtwork).length, 'artworks');
            },
            (err) => {
                console.error('Error fetching comments:', err);
                setError('Failed to load comments');
                setLoading(false);
            }
        );
        
        // Clean up the listener when the component unmounts
        return () => unsubscribe();
    }, []);

    // Add a comment to an artwork
    const addComment = async (artworkId, text) => {
        if (!currentUser) {
            throw new Error('You must be logged in to comment');
        }
        
        if (!text.trim()) {
            throw new Error('Comment cannot be empty');
        }
        
        try {
            const commentData = {
                artworkId,
                text: text.trim(),
                userId: currentUser.uid,
                userName: currentUser.displayName || 'Anonymous',
                userEmail: currentUser.email,
                createdAt: serverTimestamp()
            };
            
            const docRef = await addDoc(collection(db, 'comments'), commentData);
            console.log('Comment added with ID:', docRef.id);
            
            return docRef.id;
        } catch (err) {
            console.error('Error adding comment:', err);
            throw err;
        }
    };

    // Delete a comment (for comment owners or editors)
    const deleteComment = async (commentId) => {
        if (!currentUser) {
            throw new Error('You must be logged in to delete a comment');
        }
        
        try {
            await deleteDoc(doc(db, 'comments', commentId));
            console.log('Comment deleted:', commentId);
        } catch (err) {
            console.error('Error deleting comment:', err);
            throw err;
        }
    };

    // Get comments for a specific artwork
    const getCommentsByArtworkId = (artworkId) => {
        return comments[artworkId] || [];
    };

    // Get comment count for a specific artwork
    const getCommentCount = (artworkId) => {
        return comments[artworkId]?.length || 0;
    };

    // Get recent comments for a specific artwork
    const getRecentComments = (artworkId, count = 3) => {
        const artworkComments = comments[artworkId] || [];
        return artworkComments.slice(0, count);
    };

    return (
        <CommentsContext.Provider
            value={{
                comments,
                loading,
                error,
                addComment,
                deleteComment,
                getCommentsByArtworkId,
                getCommentCount,
                getRecentComments
            }}
        >
            {children}
        </CommentsContext.Provider>
    );
};

// Custom hook for using the comments context
export const useComments = () => {
    const context = useContext(CommentsContext);
    if (!context) {
        throw new Error('useComments must be used within a CommentsProvider');
    }
    return context;
};
