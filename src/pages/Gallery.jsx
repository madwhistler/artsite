import { motion } from 'framer-motion';
import { useContext, useEffect, useState } from 'react';
import { styles } from '../components/styles.js';
import { galleryStyles } from './galleryStyles.js';
import { NavigationContext } from '../components/NavigationContext';
import { pageVariants } from '../animations/animationVariants';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useFavorites } from '../components/FavoritesContext';
import { useSiteFavorites } from '../components/SiteFavoritesContext';
import { useComments } from '../components/CommentsContext';
import { Heart, ZoomIn, MessageSquare } from 'lucide-react';
import ImageDetailModal from '../components/ImageDetailModal';
import CommentModal from '../components/CommentModal';

// Function to enhance artwork tags by adding originalId, medium, and status
const enhanceArtworkTags = (artwork) => {
    // Start with existing tags or an empty array
    const existingTags = Array.isArray(artwork.tags)
        ? [...artwork.tags]
        : typeof artwork.tags === 'string'
            ? artwork.tags.split(',').map(tag => tag.trim())
            : [];

    const enhancedTags = [...existingTags];

    // Add medium as a tag if it exists
    if (artwork.medium) {
        const mediumTag = artwork.medium.toLowerCase();
        if (!enhancedTags.includes(mediumTag)) {
            enhancedTags.push(mediumTag);
        }
    }

    // Add status as a tag if it exists (including available and sold)
    if (artwork.status) {
        const statusTag = artwork.status.toLowerCase();
        if (!enhancedTags.includes(statusTag)) {
            enhancedTags.push(statusTag);
        }
    }

    // Add originalId as a tag if it exists
    if (artwork.originalId) {
        const idTag = artwork.originalId.toLowerCase();
        if (!enhancedTags.includes(idTag)) {
            enhancedTags.push(idTag);
        }
    }

    // Remove duplicates
    return [...new Set(enhancedTags)];
};

// Updated function to handle both Google Drive and Firebase Storage URLs
const transformImageUrl = (url, useCacheBusting = false) => {
    if (!url) return '';

    // If it's a Firebase Storage URL (either production or emulator), return it as is
    if (url.includes('storage.googleapis.com') ||
        url.includes('localhost:9199')) {
        console.log(`Using Firebase Storage URL: ${url}`);
        return url;
    }

    // If it's already a Google Photos URL, return it as is
    if (url.includes('lh3.googleusercontent.com')) {
        return url;
    }

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
            // Use w0 parameter to get the original size image without cropping
            let thumbnailUrl = `https://lh3.googleusercontent.com/d/${fileId}=w0`;

            // Only add cache-busting when explicitly requested (for retries)
            if (useCacheBusting) {
                const cacheBuster = new Date().getTime();
                thumbnailUrl += `?cb=${cacheBuster}`;
            }

            console.log(`Transformed Google Drive URL: ${url} -> ${thumbnailUrl}`);
            return thumbnailUrl;
        }
    }

    // Only add cache-busting when explicitly requested
    if (useCacheBusting) {
        if (url.includes('?')) {
            return `${url}&cb=${new Date().getTime()}`;
        } else {
            return `${url}?cb=${new Date().getTime()}`;
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
    const { getFavoriteCount } = useSiteFavorites();
    const { getCommentCount } = useComments();
    const [selectedArtwork, setSelectedArtwork] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [hoveredItem, setHoveredItem] = useState(null);
    const [visibleCount, setVisibleCount] = useState(12); // Initial batch size for progressive loading

    // Check which Firestore instance we're connected to
    useEffect(() => {

        // Try to determine if we're connected to the emulator
        const isEmulator = db._databaseId?.projectId === 'haven-artsite' &&
                          (db._settings?.host?.includes('localhost') ||
                           db._settings?.useFetchStreams === false);

        console.log('Connected to emulator (detected):', isEmulator);
    }, []);

    // Function to load more images
    const loadMoreImages = () => {
        setVisibleCount(prevCount => Math.min(prevCount + 12, artworks.length));
    };

    // Handle scroll events for infinite scrolling
    useEffect(() => {
        const handleScroll = () => {
            // Check if we're near the bottom of the page
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
                loadMoreImages();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [artworks.length]);

    // Reset visible count when artworks change
    useEffect(() => {
        setVisibleCount(12);
    }, [artworks]);

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

                        // Always enhance the artwork tags with originalId, medium, and status
                        artwork.tags = enhanceArtworkTags(artwork);

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

                                // Always enhance the artwork tags with originalId, medium, and status
                                artwork.tags = enhanceArtworkTags(artwork);

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

    const handleCommentClick = (e, artwork) => {
        e.stopPropagation(); // Prevent triggering the parent click handler
        setSelectedArtwork(artwork);
        setShowCommentModal(true);
    };

    const closeCommentModal = () => {
        setShowCommentModal(false);
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
                    {artworks.slice(0, visibleCount).map(artwork => (
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
                                    src={transformImageUrl(artwork.imageUrl)}
                                    alt={artwork.itemName}
                                    loading="lazy"
                                    style={galleryStyles.image}
                                    onError={(e) => {
                                        // Prevent infinite error loop by checking if already using placeholder
                                        if (e.target.dataset.retryCount >= 2 || e.target.src.includes('placeholder.com')) {
                                            if (!e.target.dataset.usedPlaceholder) {
                                                console.error('Image failed to load after retries:', artwork.imageUrl);
                                                e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                                                // Set a flag to prevent further error handling
                                                e.target.dataset.usedPlaceholder = 'true';
                                            }
                                            return;
                                        }

                                        // Track retry count
                                        const retryCount = parseInt(e.target.dataset.retryCount || '0', 10) + 1;
                                        e.target.dataset.retryCount = retryCount;

                                        console.warn(`Retry ${retryCount} for image:`, artwork.imageUrl);

                                        // Add a small delay before retrying to avoid rate limits
                                        setTimeout(() => {
                                            // Use cache-busting for retries
                                            e.target.src = transformImageUrl(artwork.imageUrl, true);
                                        }, 1000 * retryCount); // Increasing delay for each retry
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
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <div style={galleryStyles.iconButton} onClick={(e) => handleCommentClick(e, artwork)}>
                                            <MessageSquare
                                                size={20}
                                                color={'#ffffff'}
                                            />
                                            {getCommentCount(artwork.id) > 0 && (
                                                <span style={galleryStyles.iconBadge}>{getCommentCount(artwork.id)}</span>
                                            )}
                                        </div>
                                        <div style={galleryStyles.iconButton} onClick={(e) => handleFavoriteClick(e, artwork.id)}>
                                            <Heart
                                                size={20}
                                                color={isFavorite(artwork.id) ? '#ff0000' : '#ffffff'}
                                                fill={isFavorite(artwork.id) ? '#ff0000' : 'transparent'}
                                            />
                                        </div>
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
                isFavorite={selectedArtwork ? isFavorite(selectedArtwork.id) : false}
                onToggleFavorite={() => selectedArtwork && toggleFavorite(selectedArtwork.id)}
                favoriteCount={selectedArtwork ? getFavoriteCount(selectedArtwork.id) : 0}
                commentCount={selectedArtwork ? getCommentCount(selectedArtwork.id) : 0}
                onCommentClick={() => {
                    closeDetailModal();
                    setShowCommentModal(true);
                }}
            />

            {/* Comments modal */}
            {selectedArtwork && (
                <CommentModal
                    isOpen={showCommentModal}
                    onClose={closeCommentModal}
                    artworkId={selectedArtwork.id}
                    artworkName={selectedArtwork.itemName}
                />
            )}
        </motion.div>
    );
};
