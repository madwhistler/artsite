import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { styles } from '../components/styles.js';
import { galleryStyles } from './galleryStyles.js';
import { NavigationContext } from '../components/NavigationContext';
import { pageVariants } from '../animations/animationVariants';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useFavorites } from '../components/FavoritesContext';
import { useSiteFavorites } from '../components/SiteFavoritesContext';
import { useComments } from '../components/CommentsContext';
import { Heart, ZoomIn, Award, MessageSquare } from 'lucide-react';
import ImageDetailModal from '../components/ImageDetailModal';
import CommentModal from '../components/CommentModal';
import CommentList from '../components/CommentList';
import CommentForm from '../components/CommentForm';
import { useContext } from 'react';

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

    // Handle Google Drive URLs
    if (url.includes('drive.google.com')) {
        let fileId = null;

        // Handle "open" format URLs: https://drive.google.com/open?id=FILE_ID
        if (url.includes('open?id=')) {
            const idParam = url.split('open?id=')[1];
            // Extract the ID part before any additional parameters
            fileId = idParam.split('&')[0];
        }
        // Handle "file" format URLs: https://drive.google.com/file/d/FILE_ID/view
        else if (url.includes('/file/d/')) {
            const parts = url.split('/file/d/')[1].split('/');
            if (parts.length > 0) {
                fileId = parts[0];
            }
        }
        // Handle other formats with a generic regex
        else {
            const match = url.match(/[-\w]{25,}/);
            fileId = match ? match[0] : null;
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

    // Return original URL if no transformation was applied
    return url;
};

// Extract file ID from Google Drive URL
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

/**
 * Site Favorites Gallery Component
 * Displays the top 3 artworks with the highest favorite counts
 * @param {Object} props - Component props
 * @param {string} props.title - Gallery title
 */
export const SiteFavoritesGallery = ({ title }) => {
    const { isBackNavigation } = useContext(NavigationContext);
    const [artworks, setArtworks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { toggleFavorite, isFavorite } = useFavorites();
    const { getFavoriteCount, siteFavorites } = useSiteFavorites();
    const { getCommentCount, getRecentComments } = useComments();
    const [selectedArtwork, setSelectedArtwork] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [hoveredItem, setHoveredItem] = useState(null);
    const MAX_ARTWORKS = 3; // Always display exactly 3 artworks

    // No need for scroll handling or visible count as we're only showing 3 artworks

    // Fetch the top 3 artworks with the highest favorite counts
    useEffect(() => {
        const fetchTopArtworks = async () => {
            try {
                setLoading(true);

                // Fetch all artworks with images
                const artworksRef = collection(db, 'artwork');
                const q = query(artworksRef, where('imageUrl', '>', ''));
                const querySnapshot = await getDocs(q);
                const allArtworks = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    const artwork = {
                        id: doc.id,
                        ...data,
                        favoriteCount: getFavoriteCount(doc.id)
                    };

                    // If tags are missing, initialize as empty array
                    if (!artwork.tags) {
                        artwork.tags = [];
                    }

                    return artwork;
                });

                // Filter to only include artworks with at least 1 favorite
                const favoriteArtworks = allArtworks.filter(artwork => artwork.favoriteCount > 0);

                // Sort by favorite count (highest first), then by ID for ties
                favoriteArtworks.sort((a, b) => {
                    if (b.favoriteCount !== a.favoriteCount) {
                        return b.favoriteCount - a.favoriteCount;
                    }
                    // If favorite counts are equal, sort by ID
                    return a.id.localeCompare(b.id);
                });

                // Take only the top 3 artworks
                const topArtworks = favoriteArtworks.slice(0, MAX_ARTWORKS);

                setArtworks(topArtworks);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching top artworks:', err);
                setError('Failed to load gallery items');
                setLoading(false);
            }
        };

        fetchTopArtworks();
    }, [getFavoriteCount, siteFavorites]);

    const handleFavoriteClick = (e, artworkId) => {
        e.stopPropagation(); // Prevent triggering the parent click handler
        toggleFavorite(artworkId);
    };

    const handleArtworkClick = (artwork) => {
        setSelectedArtwork(artwork);
        setShowDetailModal(true);
    };

    const handleCommentClick = (e, artwork) => {
        e.stopPropagation(); // Prevent triggering the parent click handler
        setSelectedArtwork(artwork);
        setShowCommentModal(true);
    };

    const closeCommentModal = () => {
        setShowCommentModal(false);
    };

    // No need for loadMoreImages or threshold change handlers

    return (
        <motion.div
            style={galleryStyles.container}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants(isBackNavigation)}
        >
            <div style={galleryStyles.header}>
                <h1 style={styles.heading}>{title}</h1>
                {loading ? (
                    <p>Loading artworks...</p>
                ) : error ? (
                    <p style={{ color: 'red' }}>{error}</p>
                ) : artworks.length === 0 ? (
                    <p>No artworks have been favorited yet.</p>
                ) : null}
            </div>

            <div style={{...galleryStyles.gridContainer, padding: '0 4rem 4rem 4rem'}}>
                <div style={{...galleryStyles.grid, gridTemplateColumns: '1fr', gap: '4rem'}}>
                    {artworks.map((artwork) => (
                        <div
                            key={artwork.id}
                            style={{
                                ...galleryStyles.item,
                                transform: hoveredItem === artwork.id ? 'scale(1.03)' : 'scale(1)'
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

                                        // Try with cache busting
                                        setTimeout(() => {
                                            e.target.src = transformImageUrl(artwork.imageUrl, true);
                                        }, 1000 * retryCount);
                                    }}
                                />
                                <div style={galleryStyles.imageOverlay}>
                                    <div style={galleryStyles.zoomIcon}>
                                        <ZoomIn size={24} color="#ffffff" />
                                    </div>
                                </div>
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
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            marginTop: '5px',
                                            color: '#ffcc00'
                                        }}>
                                            <Award size={16} color="#ffcc00" style={{ marginRight: '5px' }} />
                                            <span>{artwork.favoriteCount} favorites</span>
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
                            <div style={{
                                padding: '2rem',
                                backgroundColor: '#1a1a1a',
                                marginTop: '1rem',
                                borderRadius: '8px',
                                fontSize: '1.1rem',
                                lineHeight: '1.6'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, color: '#ffcc00' }}>Community Comments</h3>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            color: '#ffcc00',
                                            fontSize: '0.9rem'
                                        }}
                                        onClick={(e) => handleCommentClick(e, artwork)}
                                    >
                                        <span>View all</span>
                                        <MessageSquare size={16} style={{ marginLeft: '5px' }} />
                                    </div>
                                </div>

                                {/* Display recent comments */}
                                <CommentList
                                    artworkId={artwork.id}
                                    limit={3}
                                    showEmpty={false}
                                />

                                {/* Comment form */}
                                <CommentForm
                                    artworkId={artwork.id}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showDetailModal && selectedArtwork && (
                <ImageDetailModal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    artwork={selectedArtwork}
                    originalFileId={selectedArtwork ? extractFileId(selectedArtwork.imageUrl) : null}
                    isFavorite={isFavorite(selectedArtwork.id)}
                    onToggleFavorite={() => toggleFavorite(selectedArtwork.id)}
                    favoriteCount={selectedArtwork.favoriteCount}
                    commentCount={getCommentCount(selectedArtwork.id)}
                    onCommentClick={() => {
                        setShowDetailModal(false);
                        setShowCommentModal(true);
                    }}
                />
            )}

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
