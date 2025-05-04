import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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

                // Try to fetch from Firestore first
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
                    const response = await fetch(textFilePath);
                    console.log('Local file fetch response:', response);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch content: ${response.statusText}`);
                    }
                    const text = await response.text();
                    console.log('Local file content length:', text.length);
                    setContent(text);
                    setOriginalContent(text);
                    console.log('Content loaded from local file');

                    // Upload the local content to Firestore for future use
                    await uploadLocalContentToFirestore(text, textFilePath);
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
        saveImage
    };
};
