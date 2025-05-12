import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { resizeAndConvertToBase64 } from '../utils/imageUtils';

/**
 * Custom hook to handle Firestore content operations
 * @param {string} textFilePath - Path to the text file (used as document ID)
 * @param {string} imagePath - Path to the image file (used for image document ID)
 * @returns {Object} - Content state and operations
 */
export const useFirestoreContent = (textFilePath, imagePath) => {
    const [content, setContent] = useState('');
    const [originalContent, setOriginalContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUsingEmulator, setIsUsingEmulator] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Extract the filename from the path for use as document ID
    const getDocumentId = (path) => {
        if (!path) return null;
        const parts = path.split('/');
        return parts[parts.length - 1];
    };

    // Check if we're connected to the Firebase emulator
    useEffect(() => {
        const checkFirestoreConnection = async () => {
            // Check if we're using the Firebase emulator based on environment variables
            const envUsingEmulator =
                window.location.hostname === 'localhost' &&
                import.meta.env.DEV &&
                import.meta.env.VITE_USE_EMULATOR === 'true';

            console.log('Emulator status from env:', envUsingEmulator);
            setIsUsingEmulator(envUsingEmulator);

            // If using emulator, ensure the collection exists
            if (envUsingEmulator) {
                try {
                    const sampleDocRef = doc(db, 'editablePages', 'sample');
                    const docSnap = await getDoc(sampleDocRef);

                    if (!docSnap.exists()) {
                        console.log('Creating sample document in editablePages collection...');
                        // Create a sample document to ensure the collection exists
                        await setDoc(sampleDocRef, {
                            content: '<h1>Sample Editable Content</h1><p>This is a sample document created automatically.</p>',
                            originalPath: '/sample.html',
                            updatedAt: new Date(),
                            updatedBy: 'system'
                        });
                        console.log('Sample document created successfully');
                    } else {
                        console.log('editablePages collection already exists in emulator');
                    }
                } catch (error) {
                    console.error('Error checking/initializing editablePages collection:', error);
                }
            }
        };

        checkFirestoreConnection();
    }, []);

    // Fetch content from Firestore or local file
    useEffect(() => {
        const fetchContent = async () => {
            try {
                console.log('Fetching editable content...');
                setLoading(true);
                setError(null);

                const docId = getDocumentId(textFilePath);
                console.log('Document ID:', docId);
                if (!docId) {
                    throw new Error('Invalid text file path');
                }

                // First, check if there's incorrect content in Firestore and clear it if needed
                console.log('Checking for incorrect content in Firestore...');
                const wasCleared = await clearFirestoreContent();
                if (wasCleared) {
                    console.log('Incorrect content was cleared from Firestore');
                }

                // Try to fetch from Firestore
                console.log('Attempting to fetch from Firestore collection: editablePages');
                const docRef = doc(db, 'editablePages', docId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    // Document exists in Firestore
                    console.log('Document found in Firestore');
                    const docData = docSnap.data();
                    setContent(docData.content);
                    setOriginalContent(docData.content);
                    console.log('Content loaded from Firestore');
                } else {
                    console.log('Document not found in Firestore, falling back to local file');
                    // Fallback to fetch from local file if not in Firestore
                    try {
                        // Use absolute path if textFilePath doesn't start with /
                        const fetchPath = textFilePath.startsWith('/') ? textFilePath : `/${textFilePath}`;
                        console.log('Fetching from path:', fetchPath);
                        console.log('Full URL being fetched:', new URL(fetchPath, window.location.origin).href);
                        console.log('Current window location:', window.location.href);

                        // In a SPA, fetching relative paths can sometimes resolve to the index.html
                        // Let's ensure we're fetching from the correct location by using an absolute URL
                        // and adding a cache-busting parameter
                        const timestamp = new Date().getTime();
                        const absoluteUrl = new URL(fetchPath, window.location.origin).href;
                        const urlWithCacheBusting = `${absoluteUrl}?_=${timestamp}`;
                        console.log('Fetching with cache busting:', urlWithCacheBusting);

                        const response = await fetch(urlWithCacheBusting, {
                            headers: {
                                'Cache-Control': 'no-cache, no-store, must-revalidate',
                                'Pragma': 'no-cache',
                                'Expires': '0'
                            }
                        });
                        console.log('Local file fetch response:', response);

                        if (!response.ok) {
                            throw new Error(`Failed to fetch content: ${response.statusText}`);
                        }

                        const text = await response.text();
                        console.log('Local file content length:', text.length);
                        console.log('Local file content preview:', text.substring(0, 100));

                        if (!text || text.trim() === '') {
                            throw new Error('Fetched content is empty');
                        }

                        // Check if we accidentally loaded a full HTML page
                        if (text.includes('<!DOCTYPE html>') || text.includes('<html') || text.includes('<title>')) {
                            console.error('Detected full HTML page instead of content fragment');
                            throw new Error('Loaded a full HTML page instead of content fragment. Please check the file path.');
                        } else {
                            // Content looks good, use it as is
                            setContent(text);
                            setOriginalContent(text);
                        }
                        console.log('Content loaded from local file');
                    } catch (fetchError) {
                        console.error('Error fetching local file:', fetchError);
                        setError(`Error loading content: ${fetchError.message}`);
                        setLoading(false);
                    }

                    // Upload the local content to Firestore for future use
                    try {
                        // Use the text variable directly instead of the content state
                        // This ensures we're using the freshly loaded content
                        if (text && text.trim() !== '') {
                            await uploadLocalContentToFirestore(text, textFilePath);
                        }
                    } catch (uploadError) {
                        console.error('Error uploading content to Firestore:', uploadError);
                    }
                }

                // Handle image
                if (imagePath) {
                    const imageDocId = getDocumentId(imagePath);
                    const imageDocRef = doc(db, 'editableImages', imageDocId);
                    const imageDocSnap = await getDoc(imageDocRef);

                    if (imageDocSnap.exists()) {
                        // Image exists in Firestore
                        console.log('Image found in Firestore');
                        const imageData = imageDocSnap.data();
                        setImageUrl(imageData.imageData);
                    } else {
                        // Handle local path (from public directory)
                        console.log('Using local image path');

                        // If the path doesn't start with '/', add it
                        const localPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
                        console.log('Normalized local image path:', localPath);

                        // Set the image URL to the local path
                        setImageUrl(localPath);
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching content:', err);
                setError('Failed to load content. Please try again later.');
                setLoading(false);
            }
        };

        fetchContent();
    }, [textFilePath, imagePath]);

    // Upload local content to Firestore
    const uploadLocalContentToFirestore = async (localContent, filePath) => {
        try {
            const docId = getDocumentId(filePath);
            if (!docId) {
                throw new Error('Invalid file path');
            }

            // Check if the content is valid before uploading
            if (!localContent || localContent.trim() === '') {
                throw new Error('Cannot upload empty content to Firestore');
            }

            // Check if we're trying to upload a full HTML page
            if (localContent.includes('<!DOCTYPE html>') || localContent.includes('<html') || localContent.includes('<title>')) {
                console.error('Attempting to upload a full HTML page to Firestore');
                throw new Error('Cannot upload full HTML page to Firestore');
            }

            const docRef = doc(db, 'editablePages', docId);
            await setDoc(docRef, {
                content: localContent,
                originalPath: filePath,
                updatedAt: new Date(),
                updatedBy: 'system',
                createdAt: new Date()
            });
            console.log('Local content uploaded to Firestore');
        } catch (err) {
            console.error('Error uploading local content to Firestore:', err);
        }
    };

    // Clear incorrect content from Firestore
    const clearFirestoreContent = async () => {
        try {
            const docId = getDocumentId(textFilePath);
            if (!docId) {
                throw new Error('Invalid text file path');
            }

            const docRef = doc(db, 'editablePages', docId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const docData = docSnap.data();
                const currentContent = docData.content;

                // Check if the current content is a full HTML page
                if (currentContent && (currentContent.includes('<!DOCTYPE html>') ||
                                      currentContent.includes('<html') ||
                                      currentContent.includes('<title>'))) {
                    console.warn('Found incorrect HTML page content in Firestore, deleting document');
                    await deleteDoc(docRef);
                    console.log('Deleted incorrect content from Firestore');
                    return true;
                }
            }
            return false;
        } catch (err) {
            console.error('Error clearing Firestore content:', err);
            return false;
        }
    };

    // Save content to Firestore
    const saveContent = async (newContent, userId) => {
        try {
            console.log('Starting save process...');
            setIsSaving(true);
            setSaveStatus('Saving...');

            const docId = getDocumentId(textFilePath);
            console.log('Saving to document ID:', docId);
            if (!docId) {
                throw new Error('Invalid text file path');
            }

            // Check if we're connected to the emulator
            const isEmulator = db._settings?.host?.includes('localhost');
            console.log('Saving to Firestore (emulator?):', isEmulator);

            // Check if content is a full HTML page
            if (newContent && (newContent.includes('<!DOCTYPE html>') ||
                             newContent.includes('<html') ||
                             newContent.includes('<title>'))) {
                throw new Error('Cannot save full HTML page to Firestore');
            }

            // Prepare document data
            const docData = {
                content: newContent,
                originalPath: textFilePath,
                updatedAt: new Date(),
                updatedBy: userId || 'anonymous'
            };
            console.log('Document data to save:', docData);

            // Save to Firestore
            try {
                const docRef = doc(db, 'editablePages', docId);
                console.log('Document reference for save:', docRef);
                await setDoc(docRef, docData);
                console.log('Document successfully saved to Firestore');
            } catch (firestoreError) {
                console.error('Error saving to Firestore:', firestoreError);
                throw firestoreError;
            }

            setContent(newContent);
            setOriginalContent(newContent);
            setSaveStatus('Saved successfully!');
            console.log('Save completed successfully');

            // Clear save status after a delay
            setTimeout(() => {
                setSaveStatus('');
            }, 3000);

            return true;
        } catch (err) {
            console.error('Error saving content:', err);
            setSaveStatus(`Error: ${err.message}`);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    // Save image to Firestore
    const saveImage = async (file, userId) => {
        try {
            console.log('Starting image upload process...');
            setIsSaving(true);
            setSaveStatus('Uploading image...');

            const docId = getDocumentId(imagePath || file.name);
            console.log('Image document ID:', docId);
            if (!docId) {
                throw new Error('Invalid image path');
            }

            // Process image for upload (resize and convert to base64)
            const base64Image = await processImageForUpload(file);
            console.log('Image processed and converted to base64, length:', base64Image.length);

            // Save to Firestore
            const imageDocRef = doc(db, 'editableImages', docId);
            const docSnap = await getDoc(imageDocRef);

            let updateData;
            if (docSnap.exists()) {
                // Update existing document
                const existingData = docSnap.data();
                updateData = {
                    ...existingData,
                    imageData: base64Image,
                    imageName: file.name,
                    imageType: file.type,
                    updatedAt: new Date(),
                    updatedBy: userId || 'anonymous'
                };
            } else {
                // Create new document
                updateData = {
                    imageData: base64Image,
                    imageName: file.name,
                    imageType: file.type,
                    originalPath: imagePath || '',
                    updatedAt: new Date(),
                    updatedBy: userId || 'anonymous',
                    createdAt: new Date()
                };
            }

            await setDoc(imageDocRef, updateData);
            console.log('Image document saved to Firestore');

            // Update the image URL
            setImageUrl(base64Image);

            setSaveStatus('Image uploaded successfully!');
            console.log('Image upload completed successfully');

            // Clear save status after a delay
            setTimeout(() => {
                setSaveStatus('');
            }, 3000);

            return true;
        } catch (err) {
            console.error('Error in image upload process:', err);
            setSaveStatus(`Error: ${err.message}`);

            // Clear error message after a delay
            setTimeout(() => {
                setSaveStatus('');
            }, 5000);

            return false;
        } finally {
            setIsSaving(false);
        }
    };

    // Process image for upload
    const processImageForUpload = async (file) => {
        // Use the utility function to resize and convert the image
        return await resizeAndConvertToBase64(file);
    };

    return {
        content,
        setContent,
        originalContent,
        imageUrl,
        loading,
        error,
        isUsingEmulator,
        saveStatus,
        isSaving,
        saveContent,
        saveImage,
        clearFirestoreContent
    };
};
