import { motion } from 'framer-motion';
import { useContext, useEffect, useState } from 'react';
import { styles } from '../components/styles.js';
import './Gallery.css';
import { NavigationContext } from '../components/NavigationContext';
import { pageVariants } from '../animations/animationVariants';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useFavorites } from '../components/FavoritesContext';
import { useSiteFavorites } from '../components/SiteFavoritesContext';
import { useComments } from '../components/CommentsContext';
import { useAuth } from '../components/AuthContext';
import { Heart, ZoomIn, MessageSquare, UserPlus } from 'lucide-react';
import ImageDetailModal from '../components/ImageDetailModal';
import CommentModal from '../components/CommentModal';
import { transformImageUrl, extractFileId } from '../utils/imageUtils';

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

// Remove the old transformImageUrl and extractFileId functions

export const Gallery = ({ title, galleryFilter }) => {
    const { isBackNavigation } = useContext(NavigationContext);
    const [artworks, setArtworks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { toggleFavorite, isFavorite, getAllFavorites } = useFavorites();
    const { getFavoriteCount } = useSiteFavorites();
    const { getCommentCount } = useComments();
    const { currentUser } = useAuth();
    const [selectedArtwork, setSelectedArtwork] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
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

                    const filteredArtworks = allArtworks.filter(artwork => {
                        // Check if the artwork has the 'hide' tag
                        const artworkTags = Array.isArray(artwork.tags)
                            ? artwork.tags
                            : typeof artwork.tags === 'string'
                                ? artwork.tags.split(',').map(tag => tag.trim())
                                : [];

                        // Never show artworks with the 'hide' tag
                        if (artworkTags.some(tag => tag.toLowerCase() === 'hide')) {
                            return false;
                        }

                        // Only include if it's in the user's favorites
                        return favoriteIds.includes(artwork.id);
                    });

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

                                // Special treatment for 'hide' tag - never show artworks with this tag
                                if (artworkTags.some(tag => tag.toLowerCase() === 'hide')) {
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
                    let artworkData = querySnapshot.docs.map(doc => {
                        const data = doc.data();
                        const artwork = {
                            id: doc.id,
                            ...data
                        };

                        // Enhance tags to ensure we have the complete set
                        artwork.tags = enhanceArtworkTags(artwork);

                        return artwork;
                    });

                    // Filter out artworks with the 'hide' tag
                    artworkData = artworkData.filter(artwork => {
                        const artworkTags = Array.isArray(artwork.tags)
                            ? artwork.tags
                            : typeof artwork.tags === 'string'
                                ? artwork.tags.split(',').map(tag => tag.trim())
                                : [];

                        // Never show artworks with the 'hide' tag
                        return !artworkTags.some(tag => tag.toLowerCase() === 'hide');
                    });
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

    // Modal management functions
    const openRegisterModal = () => {
        setShowLoginModal(false);
        setShowRegisterModal(true);
    };

    const openLoginModal = () => {
        setShowRegisterModal(false);
        setShowLoginModal(true);
    };

    const closeAuthModals = () => {
        setShowLoginModal(false);
        setShowRegisterModal(false);
    };

    return (
        <motion.div
            className="gallery-container"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants(isBackNavigation)}
        >
            <div className="gallery-header">
                <h1 className="page-title">
                    {title}
                </h1>
            </div>

            <div className="gallery-grid-container">
                {loading && (
                    <div className="gallery-loading-message">Loading...</div>
                )}
                {error && (
                    <div className="gallery-error-message">{error}</div>
                )}

                {/* Show login prompt for SELECTED gallery when user is not logged in and has favorites */}
                {galleryFilter === 'SELECTED' && !currentUser && getAllFavorites().length > 0 && (
                    <div className="gallery-login-prompt-banner">
                        <div className="gallery-login-prompt">
                            <p>I'm glad you love my artwork! Please</p>
                            <button
                                className="gallery-friend-button"
                                onClick={openRegisterModal}
                            >
                                <UserPlus size={16} />
                                Be My Friend
                            </button>
                            <p>and I'll help you keep track of your favorites!</p>
                        </div>
                    </div>
                )}

                {artworks.length === 0 && !loading && !error && (
                    <div className="gallery-empty-message">
                        {galleryFilter === 'SELECTED'
                            ? 'No favorites selected yet. Add some favorites to see them here.'
                            : 'No artworks found for this gallery.'
                        }
                    </div>
                )}

                <div className="gallery-grid">
                    {artworks.slice(0, visibleCount).map(artwork => (
                        <div
                            key={artwork.id}
                            className="gallery-item"
                            style={{
                                transform: hoveredItem === artwork.id ? 'scale(1.02)' : 'scale(1)'
                            }}
                            onClick={() => handleArtworkClick(artwork)}
                            onMouseEnter={() => setHoveredItem(artwork.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                        >
                            <div className="gallery-image-container">
                                <img
                                    src={transformImageUrl(artwork.imageUrl)}
                                    alt={artwork.itemName}
                                    loading="lazy"
                                    className="gallery-image"
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
                                    <div className="gallery-image-overlay">
                                        <div className="gallery-zoom-icon">
                                            <ZoomIn size={24} color="#ffffff" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="gallery-info">
                                <div className="gallery-info-content">
                                    <div>
                                        <div className="gallery-title">
                                            {artwork.itemName}
                                        </div>
                                        <div className="gallery-details">
                                            {`${artwork.dimensions.height}x${artwork.dimensions.width}, ${artwork.medium}`}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <div className="gallery-icon-button" onClick={(e) => handleCommentClick(e, artwork)}>
                                            <MessageSquare
                                                size={20}
                                                color={'#ffffff'}
                                            />
                                            {getCommentCount(artwork.id) > 0 && (
                                                <span className="gallery-icon-badge">{getCommentCount(artwork.id)}</span>
                                            )}
                                        </div>
                                        <div className="gallery-icon-button gallery-favorite-button" onClick={(e) => handleFavoriteClick(e, artwork.id)}>
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

            {/* Authentication Modals */}
            <RegisterModal
                isOpen={showRegisterModal}
                onClose={closeAuthModals}
                onSwitchToLogin={openLoginModal}
            />
            <LoginModal
                isOpen={showLoginModal}
                onClose={closeAuthModals}
                onSwitchToRegister={openRegisterModal}
            />
        </motion.div>
    );
};
