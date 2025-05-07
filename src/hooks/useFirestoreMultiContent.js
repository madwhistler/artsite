import { useState, useEffect } from 'react';
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    setDoc,
    query,
    where,
    orderBy,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    connectFirestoreEmulator
} from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { resizeAndConvertToBase64 } from '../utils/imageUtils';

/**
 * Custom hook for handling multi-section content with Firestore
 * @param {string} pageId - The ID of the page
 * @param {Array} defaultSections - Default sections configuration from config.js
 */
export const useFirestoreMultiContent = (pageId, defaultSections = []) => {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUsingEmulator, setIsUsingEmulator] = useState(false);
    const [savingSection, setSavingSection] = useState(null);

    // Initialize Firestore
    const db = getFirestore(getApp());

    // Check if we should use the emulator
    useEffect(() => {
        const checkEmulator = () => {
            const useEmulator =
                window.location.hostname === 'localhost' &&
                import.meta.env.DEV &&
                import.meta.env.VITE_USE_EMULATOR === 'true';

            if (useEmulator) {
                try {
                    // Connect to Firestore emulator
                    connectFirestoreEmulator(db, 'localhost', 8080);
                    console.log('Connected to Firebase emulator');
                } catch (err) {
                    console.error('Error connecting to emulator:', err);
                }
            }

            setIsUsingEmulator(useEmulator);
            return useEmulator;
        };

        checkEmulator();
    }, [db]);

    // Helper function to get document ID from path
    const getDocumentId = (path) => {
        if (!path) return null;
        // Remove leading slash and file extension
        return path.replace(/^\//, '').replace(/\.[^/.]+$/, '');
    };

    // Load page data and sections
    useEffect(() => {
        const fetchPageData = async () => {
            try {
                setLoading(true);
                setError(null);

                // First try to get page data from Firestore
                const pageDocId = getDocumentId(pageId) || pageId;
                const pageDocRef = doc(db, 'editablePages', pageDocId);

                try {
                    const pageDoc = await getDoc(pageDocRef);

                    if (pageDoc.exists()) {
                        // Page exists in Firestore
                        console.log('Page found in Firestore:', pageDocId);

                        // Fetch all sections for this page
                        const sectionsQuery = query(
                            collection(db, 'editableBlocks'),
                            where('pageId', '==', pageDocId),
                            orderBy('order')
                        );

                        const sectionsSnapshot = await getDocs(sectionsQuery);
                        const sectionsData = [];

                        sectionsSnapshot.forEach(doc => {
                            sectionsData.push({
                                id: doc.id,
                                ...doc.data(),
                                saveStatus: ''
                            });
                        });

                        if (sectionsData.length > 0) {
                            // We have sections in Firestore
                            console.log(`Found ${sectionsData.length} sections in Firestore`);
                            setSections(sectionsData);
                            setLoading(false);
                            return;
                        } else {
                            console.log('No sections found in Firestore, using default sections');
                        }
                    } else {
                        console.log('Page not found in Firestore, using default configuration');
                    }
                } catch (firestoreError) {
                    console.error('Error fetching from Firestore:', firestoreError);
                    console.log('Falling back to default configuration');
                }

                // If we get here, we need to use the default sections
                const loadedSections = await Promise.all(
                    defaultSections.map(async (section, index) => {
                        try {
                            // Generate a unique ID for this section
                            const sectionId = `section-${index}`;

                            // Load content from local file
                            let content = '';
                            try {
                                // Make sure the path doesn't have 'public/' prefix
                                const contentPath = section.content.replace(/^public\//, '/');
                                console.log(`Fetching content from: ${contentPath}`);
                                const response = await fetch(contentPath);
                                if (response.ok) {
                                    content = await response.text();
                                    console.log(`Content loaded successfully, length: ${content.length}`);
                                } else {
                                    throw new Error(`Failed to fetch content: ${response.statusText}`);
                                }
                            } catch (fetchError) {
                                console.error(`Error fetching content for section ${index}:`, fetchError);
                                content = '<p>Error loading content</p>';
                            }

                            // Try to get image from Firestore first
                            let imageUrl = '';
                            if (section.image) {
                                try {
                                    const imageId = getDocumentId(section.image);
                                    const imageDocRef = doc(db, 'editableImages', imageId);
                                    const imageDocSnap = await getDoc(imageDocRef);

                                    if (imageDocSnap.exists()) {
                                        // Image exists in Firestore
                                        console.log('Image found in Firestore');
                                        const imageData = imageDocSnap.data();
                                        imageUrl = imageData.imageData; // Base64 image data
                                        console.log(`Image loaded from Firestore, length: ${imageUrl.length}`);
                                    } else {
                                        // Fallback to local image
                                        // Make sure the path doesn't have 'public/' prefix
                                        const imagePath = section.image.replace(/^public\//, '/');
                                        console.log(`Using local image: ${imagePath}`);
                                        imageUrl = imagePath;
                                    }
                                } catch (firestoreError) {
                                    console.error(`Error fetching image from Firestore:`, firestoreError);
                                    // Fallback to local image
                                    const imagePath = section.image.replace(/^public\//, '/');
                                    console.log(`Using local image: ${imagePath}`);
                                    imageUrl = imagePath;
                                }
                            }

                            return {
                                id: sectionId,
                                pageId: pageDocId,
                                content,
                                originalContent: content,
                                imageUrl,
                                originalImagePath: section.image,
                                align: section.align || 'left',
                                order: index,
                                saveStatus: ''
                            };
                        } catch (sectionError) {
                            console.error(`Error loading section ${index}:`, sectionError);
                            return {
                                id: `section-${index}`,
                                pageId: pageDocId,
                                content: '<p>Error loading content</p>',
                                originalContent: '<p>Error loading content</p>',
                                imageUrl: '',
                                originalImagePath: section.image,
                                align: section.align || 'left',
                                order: index,
                                error: sectionError.message,
                                saveStatus: ''
                            };
                        }
                    })
                );

                setSections(loadedSections);
                setLoading(false);
            } catch (err) {
                console.error('Error loading page data:', err);
                setError('Failed to load content. Please try again later.');
                setLoading(false);
            }
        };

        if (pageId) {
            fetchPageData();
        }
    }, [db, pageId, defaultSections]);

    // Save section content to Firestore
    const saveSectionContent = async (sectionId, content, userId) => {
        if (!sectionId || !content) return false;

        const section = sections.find(s => s.id === sectionId);
        if (!section) return false;

        try {
            setSavingSection(sectionId);

            // Update the save status
            setSections(prevSections =>
                prevSections.map(s =>
                    s.id === sectionId
                        ? {...s, saveStatus: 'Saving...'}
                        : s
                )
            );

            const pageDocId = getDocumentId(pageId) || pageId;

            // Ensure the page exists in Firestore
            const pageDocRef = doc(db, 'editablePages', pageDocId);
            const pageDoc = await getDoc(pageDocRef);

            if (!pageDoc.exists()) {
                // Create the page document if it doesn't exist
                await setDoc(pageDocRef, {
                    title: pageId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    updatedBy: userId
                });
            } else {
                // Update the page's updatedAt timestamp
                await updateDoc(pageDocRef, {
                    updatedAt: new Date(),
                    updatedBy: userId
                });
            }

            // Check if this is a new section or an existing one
            if (section.id.startsWith('section-')) {
                // This is a new section, add it to Firestore
                const sectionData = {
                    pageId: pageDocId,
                    content,
                    align: section.align,
                    order: section.order,
                    originalContentPath: section.originalImagePath,
                    imageRef: section.imageRef || null,
                    updatedAt: new Date(),
                    updatedBy: userId
                };

                const newSectionRef = await addDoc(collection(db, 'editableBlocks'), sectionData);

                // Update the section in our state with the new Firestore ID
                setSections(prevSections =>
                    prevSections.map(s =>
                        s.id === sectionId
                            ? {
                                ...s,
                                id: newSectionRef.id,
                                originalContent: content,
                                saveStatus: 'Saved successfully!'
                            }
                            : s
                    )
                );
            } else {
                // This is an existing section, update it
                const sectionRef = doc(db, 'editableBlocks', sectionId);

                await updateDoc(sectionRef, {
                    content,
                    updatedAt: new Date(),
                    updatedBy: userId
                });

                // Update the section in our state
                setSections(prevSections =>
                    prevSections.map(s =>
                        s.id === sectionId
                            ? {
                                ...s,
                                originalContent: content,
                                saveStatus: 'Saved successfully!'
                            }
                            : s
                    )
                );
            }

            // Clear save status after a delay
            setTimeout(() => {
                setSections(prevSections =>
                    prevSections.map(s =>
                        s.id === sectionId
                            ? {...s, saveStatus: ''}
                            : s
                    )
                );
            }, 3000);

            return true;
        } catch (err) {
            console.error(`Error saving section ${sectionId}:`, err);

            // Update the save status to show the error
            setSections(prevSections =>
                prevSections.map(s =>
                    s.id === sectionId
                        ? {...s, saveStatus: `Error: ${err.message}`}
                        : s
                )
            );

            return false;
        } finally {
            setSavingSection(null);
        }
    };

    // Save section image to Firestore
    const saveSectionImage = async (sectionId, file, userId) => {
        if (!sectionId || !file) return false;

        const section = sections.find(s => s.id === sectionId);
        if (!section) return false;

        try {
            setSavingSection(sectionId);

            // Update the save status
            setSections(prevSections =>
                prevSections.map(s =>
                    s.id === sectionId
                        ? {...s, saveStatus: 'Processing image...'}
                        : s
                )
            );

            const pageDocId = getDocumentId(pageId) || pageId;

            // Generate a unique ID for the image
            const imageId = `${pageDocId}-${sectionId}-${Date.now()}`;

            // Process image for upload (resize and convert to base64)
            const base64Image = await resizeAndConvertToBase64(file);
            console.log(`Image processed and converted to base64, length: ${base64Image.length}`);

            // Save the image data to Firestore
            const imageData = {
                imageData: base64Image,
                imageName: file.name,
                imageType: file.type,
                originalPath: section.originalImagePath,
                updatedAt: new Date(),
                updatedBy: userId,
                createdAt: new Date()
            };

            const imageDocRef = doc(db, 'editableImages', imageId);
            await setDoc(imageDocRef, imageData);
            console.log('Image document saved to Firestore');

            // Update the section with the image reference
            if (section.id.startsWith('section-')) {
                // This is a new section, we'll update it when saving content
                setSections(prevSections =>
                    prevSections.map(s =>
                        s.id === sectionId
                            ? {
                                ...s,
                                imageUrl: base64Image,
                                imageRef: imageId,
                                saveStatus: 'Image uploaded successfully!'
                            }
                            : s
                    )
                );
            } else {
                // This is an existing section, update it
                const sectionRef = doc(db, 'editableBlocks', sectionId);

                await updateDoc(sectionRef, {
                    imageRef: imageId,
                    updatedAt: new Date(),
                    updatedBy: userId
                });

                // Update the section in our state
                setSections(prevSections =>
                    prevSections.map(s =>
                        s.id === sectionId
                            ? {
                                ...s,
                                imageUrl: base64Image,
                                imageRef: imageId,
                                saveStatus: 'Image uploaded successfully!'
                            }
                            : s
                    )
                );
            }

            // Clear save status after a delay
            setTimeout(() => {
                setSections(prevSections =>
                    prevSections.map(s =>
                        s.id === sectionId
                            ? {...s, saveStatus: ''}
                            : s
                    )
                );
            }, 3000);

            return true;
        } catch (err) {
            console.error(`Error uploading image for section ${sectionId}:`, err);

            // Update the save status to show the error
            setSections(prevSections =>
                prevSections.map(s =>
                    s.id === sectionId
                        ? {...s, saveStatus: `Error: ${err.message}`}
                        : s
                )
            );

            return false;
        } finally {
            setSavingSection(null);
        }
    };

    return {
        sections,
        loading,
        error,
        isUsingEmulator,
        savingSection,
        saveSectionContent,
        saveSectionImage
    };
};
