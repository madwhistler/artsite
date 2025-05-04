import { motion } from 'framer-motion';
import { useContext, useEffect, useState } from 'react';
import { styles } from '../components/styles.js';
import { galleryStyles } from './galleryStyles.js';
import { NavigationContext } from '../components/NavigationContext';
import { pageVariants } from '../animations/animationVariants';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useFavorites } from '../components/FavoritesContext';
import { Heart, ZoomIn } from 'lucide-react';
import ImageDetailModal from '../components/ImageDetailModal';

// Function to generate tags from artwork data if tags are missing
const generateTagsFromArtwork = (artwork) => {
    const generatedTags = [];

    // Add medium as a tag if it exists
    if (artwork.medium) {
        generatedTags.push(artwork.medium.toLowerCase());
    }

    // Add status as a tag if it's meaningful
    if (artwork.status && artwork.status !== 'available' && artwork.status !== 'sold') {
        generatedTags.push(artwork.status.toLowerCase());
    }

    // Extract potential tags from notes
    if (artwork.notes) {
        const noteWords = artwork.notes.toLowerCase().split(/\s+/);
        const potentialTags = noteWords.filter(word =>
            word.length > 3 &&
            !['this', 'that', 'with', 'from', 'have', 'been', 'were', 'they', 'their'].includes(word)
        );
        generatedTags.push(...potentialTags);
    }

    // Extract potential tags from name
    if (artwork.itemName) {
        const nameWords = artwork.itemName.toLowerCase().split(/\s+/);
        const potentialTags = nameWords.filter(word =>
            word.length > 3 &&
            !['this', 'that', 'with', 'from', 'have', 'been', 'were', 'they', 'their'].includes(word)
        );
        generatedTags.push(...potentialTags);
    }

    // Add originalId as a tag if it exists
    if (artwork.originalId) {
        generatedTags.push(artwork.originalId.toLowerCase());
    }

    // Remove duplicates
    return [...new Set(generatedTags)];
};

// Updated function to handle Google Drive URLs correctly for thumbnails
const transformGoogleDriveUrl = (url) => {
    if (!url) return '';

    // Handle Google Drive links
    if (url.includes('drive.google.com')) {
        let fileId = null;

        // Handle "open" format URLs: https://drive.google.com/open?id=FILE_ID
        if (url.includes('open?id=')) {
            const idParam = url.split('open?id=')[1];
            // Extract the ID part before any additional parameters
            fileId = idParam.split('&')[0];
        }
        // Handle "file/d" format URLs: https://drive.google.com/file/d/FILE_ID/view
        else if (url.includes('/file/d/')) {
            const parts = url.split('/file/d/')[1].split('/');
            if (parts.length > 0) {
                fileId = parts[0];
            }
        }
        // Handle other formats with a generic regex
        else {
            const fileIdMatch = url.match(/[-\w]{25,}/);
            fileId = fileIdMatch ? fileIdMatch[0] : null;
        }


        if (fileId) {
            // For Google Drive images, use the direct thumbnail approach with moderate size
            // This method avoids CSP issues by using Google's thumbnail API
            const thumbnailUrl = `https://lh3.googleusercontent.com/d/${fileId}=w800`;
            return thumbnailUrl;
        }
    }

    return url;
};

// Extract file ID from Google Drive URL - updated to match transformGoogleDriveUrl
const extractFileId = (url) => {
    if (!url) return null;

    if (url.includes('drive.google.com')) {
        // Handle "open" format URLs: https://drive.google.com/open?id=FILE_ID
        if (url.includes('open?id=')) {
            const idParam = url.split('open?id=')[1];
            // Extract the ID part before any additional parameters
            return idParam.split('&')[0];
        }
        else if (url.includes('/file/d/')) {
            const parts = url.split('/file/d/')[1].split('/');
            if (parts.length > 0) {
                return parts[0];
            }
        }
        // Handle other formats with a generic regex
        else {
            const match = url.match(/[-\w]{25,}/);
            return match ? match[0] : null;
        }
    }

    return null;
};

export const Gallery = ({ title, galleryFilter }) => {
    const { isBackNavigation } = useContext(NavigationContext);
    const [artworks, setArtworks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { toggleFavorite, isFavorite, getAllFavorites } = useFavorites();
    const [selectedArtwork, setSelectedArtwork] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [hoveredItem, setHoveredItem] = useState(null);

    // Check which Firestore instance we're connected to
    useEffect(() => {

        // Try to determine if we're connected to the emulator
        const isEmulator = db._databaseId?.projectId === 'haven-artsite' &&
                          (db._settings?.host?.includes('localhost') ||
                           db._settings?.useFetchStreams === false);

        console.log('Connected to emulator (detected):', isEmulator);
    }, []);

    useEffect(() => {
        const fetchArtworks = async () => {
            try {
                setLoading(true);

                // Handle the special "selected" filter case
                if (galleryFilter === 'SELECTED') {
                    const favoriteIds = getAllFavorites();
                    if (favoriteIds.length === 0) {
                        setArtworks([]);
                        setLoading(false);
                        return;
                    }

                    // Firestore can't handle large IN queries, so we might need to batch
                    // For simplicity, we'll fetch all artworks with images and filter client-side
                    const artworksRef = collection(db, 'artwork');
                    const q = query(artworksRef, where('imageUrl', '>', ''));
                    const querySnapshot = await getDocs(q);
                    const allArtworks = querySnapshot.docs.map(doc => {
                        const data = doc.data();

                        // Check for tags field
                        if ('tags' in data) {
                            console.log('SELECTED filter - Tags found:', doc.id, data.tags);
                        } else {
                            // Try to access tags directly
                            const tagsValue = data['tags'];
                         }

                        const artwork = {
                            id: doc.id,
                            ...data
                        };

                        // If tags are missing, generate them from other fields
                        if (!artwork.tags) {
                            artwork.tags = generateTagsFromArtwork(artwork);
                        }

                        return artwork;
                    });

                    const filteredArtworks = allArtworks.filter(artwork =>
                        favoriteIds.includes(artwork.id)
                    );

                    setArtworks(filteredArtworks);
                } else {
                    // Updated filter case to handle tag arrays
                    const artworksRef = collection(db, 'artwork');
                    const conditions = [where('imageUrl', '>', '')];

                    if (galleryFilter) {
                        if (Array.isArray(galleryFilter)) {
                            // If galleryFilter is an array of tags, we need to handle it differently
                            // Firestore doesn't support OR queries directly, so we'll fetch all artworks
                            // with images and filter client-side
                            const q = query(artworksRef, ...conditions);
                            const querySnapshot = await getDocs(q);
                            const allArtworks = querySnapshot.docs.map(doc => {
                                const data = doc.data();


                                // Check if tags exist in the raw data
                                if ('tags' in data) {

                                } else {

                                    // Check if there's a hidden or non-enumerable tags property
                                    const descriptors = Object.getOwnPropertyDescriptors(data);

                                    // Try to access tags directly
                                    const tagsValue = data['tags'];

                                    // Check the raw document data
                                    // Try to access the raw data
                                    try {
                                        const rawData = doc._document?.data?.value?.mapValue?.fields;
                                        if (rawData && rawData.tags) {
                                         }
                                    } catch (e) {
                                    }
                                }

                                // Create the artwork object
                                const artwork = {
                                    id: doc.id,
                                    ...data
                                };

                                // If tags are missing, generate them from other fields
                                if (!artwork.tags) {
                                    artwork.tags = generateTagsFromArtwork(artwork);
                                }

                                return artwork;
                            });


                            // Filter artworks that have at least one matching tag
                            const filteredArtworks = allArtworks.filter(artwork => {
                                // If the artwork has no tags, it doesn't match
                                if (!artwork.tags) {
                                     return false;
                                }

                                // Convert tags to array if it's a string (comma-separated)
                                const artworkTags = Array.isArray(artwork.tags)
                                    ? artwork.tags
                                    : typeof artwork.tags === 'string'
                                        ? artwork.tags.split(',').map(tag => tag.trim())
                                        : [];

                                if (artworkTags.length === 0) {
                                   return false;
                                }


                                // Check if any of the artwork's tags match any of the filter tags
                                const hasMatch = galleryFilter.some(filterTag => {
                                     return artworkTags.some(artworkTag => {
                                        const isMatch = artworkTag.toLowerCase().includes(filterTag.toLowerCase()) ||
                                                      filterTag.toLowerCase().includes(artworkTag.toLowerCase());
                                        return isMatch;
                                    });
                                });

                                return hasMatch;
                            });

                            setArtworks(filteredArtworks);
                            setLoading(false);
                            return;
                        } else if (galleryFilter !== 'ALL') {
                            // Backward compatibility: if galleryFilter is a string (not 'ALL'),
                            // use the original behavior of filtering by originalId
                            conditions.push(where('originalId', '==', galleryFilter));
                        }
                    }

                    // If we get here, we're using the original query approach
                    const q = query(artworksRef, ...conditions);
                    const querySnapshot = await getDocs(q);
                    const artworkData = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setArtworks(artworkData);
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching artworks:', err);
                setError('Failed to load gallery items');
                setLoading(false);
            }
        };

        fetchArtworks();
    }, [galleryFilter, getAllFavorites]);

    const handleFavoriteClick = (e, artworkId) => {
        e.stopPropagation(); // Prevent triggering the parent click handler
        toggleFavorite(artworkId);
    };

    const handleArtworkClick = (artwork) => {
        setSelectedArtwork(artwork);
        setShowDetailModal(true);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
    };

    return (
        <motion.div
            className="page"
            style={galleryStyles.container}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants(isBackNavigation)}
        >
            <div style={galleryStyles.header}>
                <h1 className="page-title" style={styles.pageTitle}>
                    {title}
                </h1>
            </div>

            <div style={galleryStyles.gridContainer}>
                {loading && (
                    <div style={galleryStyles.loadingMessage}>Loading...</div>
                )}
                {error && (
                    <div style={galleryStyles.errorMessage}>{error}</div>
                )}
                {artworks.length === 0 && !loading && !error && (
                    <div style={galleryStyles.emptyMessage}>
                        {galleryFilter === 'SELECTED'
                            ? 'No favorites selected yet. Add some favorites to see them here.'
                            : 'No artworks found for this gallery.'}
                    </div>
                )}

                <div style={galleryStyles.grid}>
                    {artworks.map(artwork => (
                        <div
                            key={artwork.id}
                            style={{
                                ...galleryStyles.item,
                                transform: hoveredItem === artwork.id ? 'scale(1.02)' : 'scale(1)'
                            }}
                            onClick={() => handleArtworkClick(artwork)}
                            onMouseEnter={() => setHoveredItem(artwork.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                        >
                            <div style={galleryStyles.imageContainer}>
                                <img
                                    src={transformGoogleDriveUrl(artwork.imageUrl)}
                                    alt={artwork.itemName}
                                    loading="lazy"
                                    style={galleryStyles.image}
                                    onError={(e) => {
                                        console.error('Image failed to load:', artwork.imageUrl);
                                        e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                                    }}
                                />
                                {hoveredItem === artwork.id && (
                                    <div style={galleryStyles.imageOverlay}>
                                        <div style={galleryStyles.zoomIcon}>
                                            <ZoomIn size={24} color="#ffffff" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div style={galleryStyles.info}>
                                <div style={galleryStyles.infoContent}>
                                    <div>
                                        <div style={galleryStyles.title}>
                                            {artwork.itemName}
                                        </div>
                                        <div style={galleryStyles.details}>
                                            {`${artwork.dimensions.height}x${artwork.dimensions.width}, ${artwork.medium}`}
                                        </div>
                                    </div>
                                    <div style={galleryStyles.favoriteButton} onClick={(e) => handleFavoriteClick(e, artwork.id)}>
                                        <Heart
                                            size={20}
                                            color={isFavorite(artwork.id) ? '#ff0000' : '#ffffff'}
                                            fill={isFavorite(artwork.id) ? '#ff0000' : 'transparent'}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Image detail modal */}
            <ImageDetailModal
                isOpen={showDetailModal}
                onClose={closeDetailModal}
                artwork={selectedArtwork}
                originalFileId={selectedArtwork ? extractFileId(selectedArtwork.imageUrl) : null}
            />
        </motion.div>
    );
};
