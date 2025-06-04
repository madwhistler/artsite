import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';

/**
 * Get document ID from file path
 */
const getDocumentId = (filePath) => {
    if (!filePath) return null;
    return filePath.replace(/[^a-zA-Z0-9]/g, '_');
};

/**
 * Custom hook to handle Firestore video content operations
 * @param {string} videoPath - Path to the video file (used as document ID)
 * @param {string} initialEmbedCode - Initial embed code if provided
 * @returns {Object} - Video state and operations
 */
export const useFirestoreVideo = (videoPath, initialEmbedCode) => {
    const [videoUrl, setVideoUrl] = useState('');
    const [embedCode, setEmbedCode] = useState(initialEmbedCode || '');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUsingEmulator, setIsUsingEmulator] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Check Firebase connection and emulator status
    useEffect(() => {
        const checkFirestoreConnection = async () => {
            try {
                // Check if we're using emulator by looking at the host
                const isEmulator = window.location.hostname === 'localhost' ||
                                 window.location.hostname === '127.0.0.1';
                setIsUsingEmulator(isEmulator);

                // Try a simple Firestore operation to test connection
                const testDoc = doc(db, 'test', 'connection');
                await getDoc(testDoc);
                console.log('Firestore connection successful, using emulator:', isEmulator);
            } catch (error) {
                console.error('Error checking Firestore connection:', error);
                // Don't set error state here - allow video to display even if Firestore fails
                // Just log the issue and continue
                console.log('Continuing without Firestore connection...');
            }
        };

        checkFirestoreConnection();
    }, []);

    // Fetch video content from Firestore or local file
    useEffect(() => {
        const fetchVideoContent = async () => {
            try {
                console.log('Fetching video content...');
                setLoading(true);
                setError(null);

                const docId = getDocumentId(videoPath);
                console.log('Video document ID:', docId);

                if (!docId) {
                    // If no video path provided, just use embed code
                    if (initialEmbedCode) {
                        setEmbedCode(initialEmbedCode);
                    }
                    setLoading(false);
                    return;
                }

                // Try to get video content from Firestore
                try {
                    const docRef = doc(db, 'editableVideos', docId);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        // Document exists in Firestore
                        console.log('Video document found in Firestore');
                        const docData = docSnap.data();

                        if (docData.videoUrl) {
                            setVideoUrl(docData.videoUrl);
                        }
                        if (docData.embedCode) {
                            setEmbedCode(docData.embedCode);
                        }
                        console.log('Video content loaded from Firestore');
                    } else {
                        console.log('Video document not found in Firestore, using fallback');
                        // Fallback to local video file if provided
                        if (videoPath) {
                            const fetchPath = videoPath.startsWith('/') ? videoPath : `/${videoPath}`;
                            setVideoUrl(fetchPath);
                        }
                        if (initialEmbedCode) {
                            setEmbedCode(initialEmbedCode);
                        }
                    }
                } catch (firestoreError) {
                    console.error('Error accessing Firestore for video content:', firestoreError);
                    console.log('Firestore unavailable, using fallback content');
                    // Fallback to local content when Firestore fails
                    if (videoPath) {
                        const fetchPath = videoPath.startsWith('/') ? videoPath : `/${videoPath}`;
                        setVideoUrl(fetchPath);
                    }
                    if (initialEmbedCode) {
                        setEmbedCode(initialEmbedCode);
                    }
                }
            } catch (error) {
                console.error('Error in video content fetching:', error);
                // Only set error for critical failures, not Firestore connection issues
                if (!initialEmbedCode && !videoPath) {
                    setError(`Failed to load video content: ${error.message}`);
                } else {
                    console.log('Using fallback content despite error');
                    // Fallback to local content on error
                    if (videoPath) {
                        const fetchPath = videoPath.startsWith('/') ? videoPath : `/${videoPath}`;
                        setVideoUrl(fetchPath);
                    }
                    if (initialEmbedCode) {
                        setEmbedCode(initialEmbedCode);
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        fetchVideoContent();
    }, [videoPath, initialEmbedCode]);

    // Save video file to Firebase Storage and Firestore
    const saveVideo = async (file, userId) => {
        try {
            setIsSaving(true);
            setSaveStatus('Uploading video...');

            const docId = getDocumentId(videoPath) || `video_${Date.now()}`;

            // Upload video to Firebase Storage
            const videoRef = ref(storage, `videos/${docId}/${file.name}`);
            const uploadResult = await uploadBytes(videoRef, file);

            // Get download URL
            const downloadURL = await getDownloadURL(uploadResult.ref);

            // Save video metadata to Firestore
            const videoData = {
                videoUrl: downloadURL,
                embedCode: embedCode, // Preserve existing embed code
                originalPath: videoPath,
                fileName: file.name,
                fileSize: file.size,
                contentType: file.type,
                updatedAt: new Date(),
                updatedBy: userId
            };

            const docRef = doc(db, 'editableVideos', docId);
            await setDoc(docRef, videoData);

            setVideoUrl(downloadURL);
            setSaveStatus('Video saved successfully!');

            setTimeout(() => setSaveStatus(''), 3000);
            return true;
        } catch (error) {
            console.error('Error saving video:', error);
            setSaveStatus(`Error saving video: ${error.message}`);
            setTimeout(() => setSaveStatus(''), 5000);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    // Save embed code to Firestore
    const saveEmbedCode = async (newEmbedCode, userId) => {
        try {
            setIsSaving(true);
            setSaveStatus('Saving embed code...');

            const docId = getDocumentId(videoPath) || `video_${Date.now()}`;

            // Save embed code to Firestore
            const videoData = {
                videoUrl: videoUrl, // Preserve existing video URL
                embedCode: newEmbedCode,
                originalPath: videoPath,
                updatedAt: new Date(),
                updatedBy: userId
            };

            const docRef = doc(db, 'editableVideos', docId);
            await setDoc(docRef, videoData);

            setEmbedCode(newEmbedCode);
            setSaveStatus('Embed code saved successfully!');

            setTimeout(() => setSaveStatus(''), 3000);
            return true;
        } catch (error) {
            console.error('Error saving embed code:', error);
            setSaveStatus(`Error saving embed code: ${error.message}`);
            setTimeout(() => setSaveStatus(''), 5000);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    return {
        videoUrl,
        embedCode,
        loading,
        error,
        isUsingEmulator,
        saveStatus,
        isSaving,
        saveVideo,
        saveEmbedCode
    };
};
