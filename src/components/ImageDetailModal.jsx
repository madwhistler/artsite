import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Heart, Award, MessageSquare } from 'lucide-react';

// Styles for the image detail modal
const modalStyles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        overflow: 'hidden',
    },
    container: {
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageContainer: {
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: '90%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
        transformOrigin: 'center',
        transition: 'transform 0.3s ease-out',
    },
    closeButton: {
        position: 'absolute',
        top: '20px',
        right: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'white',
        zIndex: 2010,
    },
    controls: {
        position: 'absolute',
        bottom: '20px',
        display: 'flex',
        gap: '12px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '20px',
        padding: '8px 16px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
    },
    controlButton: {
        backgroundColor: 'transparent',
        border: 'none',
        color: 'white',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    controlButtonHover: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    imageInfo: {
        position: 'absolute',
        bottom: '80px',
        left: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '10px 15px',
        borderRadius: '8px',
        color: 'white',
        maxWidth: '80%',
    },
    title: {
        fontSize: '18px',
        fontWeight: '500',
        marginBottom: '5px',
    },
    details: {
        fontSize: '14px',
        opacity: 0.8,
    },
    favoriteCount: {
        display: 'flex',
        alignItems: 'center',
        marginTop: '8px',
        color: '#ffcc00',
        fontSize: '14px',
    },
    favoriteIcon: {
        marginRight: '5px',
    },
    loading: {
        color: 'white',
        fontSize: '18px',
    }
};

const ImageDetailModal = ({ isOpen, onClose, artwork, originalFileId, isFavorite, onToggleFavorite, favoriteCount, commentCount, onCommentClick }) => {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [loading, setLoading] = useState(true);
    const [hoveredButton, setHoveredButton] = useState(null);
    const imageRef = useRef(null);

    // Determine the high-resolution image URL
    let fullImageUrl = artwork?.imageUrl;

    // If it's a Firebase Storage URL (either production or emulator), use it directly
    if (fullImageUrl && (fullImageUrl.includes('storage.googleapis.com') ||
                        fullImageUrl.includes('localhost:9199'))) {
        console.log(`Using Firebase Storage URL for high-res image: ${fullImageUrl}`);
    }
    // If it's a Google Drive URL, extract the file ID and build a direct URL
    else {
        const fileId = originalFileId || (artwork?.imageUrl?.match(/[-\w]{25,}/) || [])[0];
        if (fileId) {
            // Build a high-resolution image URL from Google Drive without cache-busting initially
            // Use w0 parameter to get the original size image without cropping
            fullImageUrl = `https://lh3.googleusercontent.com/d/${fileId}=w0`;
        }
    }

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Reset zoom, rotation and position when opening a new image
            setZoom(1);
            setRotation(0);
            setPosition({ x: 0, y: 0 });
            setLoading(true);
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen || !artwork) return null;

    const handleImageLoad = () => {
        setLoading(false);
    };

    const handleZoomIn = () => {
        setZoom(prevZoom => Math.min(prevZoom + 0.5, 4));
    };

    const handleZoomOut = () => {
        setZoom(prevZoom => {
            const newZoom = Math.max(prevZoom - 0.5, 1);
            // If zooming back to 1, reset position
            if (newZoom === 1) {
                setPosition({ x: 0, y: 0 });
            }
            return newZoom;
        });
    };

    const handleRotate = () => {
        setRotation(prevRotation => (prevRotation + 90) % 360);
    };

    const handleMouseDown = (e) => {
        if (zoom > 1) {
            setIsDragging(true);
            setStartPos({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && zoom > 1) {
            setPosition({
                x: e.clientX - startPos.x,
                y: e.clientY - startPos.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTouchStart = (e) => {
        if (zoom > 1 && e.touches.length === 1) {
            setIsDragging(true);
            setStartPos({
                x: e.touches[0].clientX - position.x,
                y: e.touches[0].clientY - position.y
            });
        }
    };

    const handleTouchMove = (e) => {
        if (isDragging && zoom > 1 && e.touches.length === 1) {
            setPosition({
                x: e.touches[0].clientX - startPos.x,
                y: e.touches[0].clientY - startPos.y
            });
            e.preventDefault(); // Prevent page scrolling
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    // Double click to toggle between zoom levels
    const handleDoubleClick = (e) => {
        if (zoom === 1) {
            setZoom(2.5);
            // Center zoom on click position
            const rect = imageRef.current.getBoundingClientRect();
            const offsetX = (e.clientX - rect.left) / rect.width;
            const offsetY = (e.clientY - rect.top) / rect.height;

            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;

            const targetX = centerX - (offsetX * rect.width * 2.5);
            const targetY = centerY - (offsetY * rect.height * 2.5);

            setPosition({
                x: targetX - centerX,
                y: targetY - centerY
            });
        } else {
            setZoom(1);
            setPosition({ x: 0, y: 0 });
        }
    };

    // Handle wheel events for zooming
    const handleWheel = (e) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            // Zoom in
            setZoom(prevZoom => Math.min(prevZoom + 0.1, 4));
        } else {
            // Zoom out
            setZoom(prevZoom => {
                const newZoom = Math.max(prevZoom - 0.1, 1);
                if (newZoom === 1) {
                    setPosition({ x: 0, y: 0 });
                }
                return newZoom;
            });
        }
    };

    const imageTransform = `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`;

    return (
        <div
            style={modalStyles.overlay}
            onClick={onClose}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleTouchEnd}
        >
            <div
                style={modalStyles.container}
                onClick={(e) => e.stopPropagation()}
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
            >
                <button style={modalStyles.closeButton} onClick={onClose}>
                    <X size={24} />
                </button>

                <div
                    style={modalStyles.imageContainer}
                    onWheel={handleWheel}
                >
                    {loading && <div style={modalStyles.loading}>Loading high-resolution image...</div>}
                    <img
                        ref={imageRef}
                        src={fullImageUrl}
                        alt={artwork.itemName}
                        style={{
                            ...modalStyles.image,
                            transform: imageTransform,
                            cursor: zoom > 1 ? 'grab' : 'default',
                            opacity: loading ? 0 : 1
                        }}
                        onLoad={handleImageLoad}
                        onError={(e) => {
                            // Prevent infinite error loop by checking retry count
                            if (e.target.dataset.retryCount >= 2) {
                                console.error('High-resolution image failed to load after retries:', fullImageUrl);

                                // Try original URL as fallback
                                if (fileId && !e.target.dataset.usedOriginal) {
                                    console.log('Falling back to original URL:', artwork?.imageUrl);
                                    e.target.src = artwork?.imageUrl;
                                    e.target.dataset.usedOriginal = 'true';
                                    e.target.dataset.retryCount = '0'; // Reset retry count for original URL
                                    return; // Don't mark as loaded yet
                                }
                                // Use placeholder as last resort
                                else if (!e.target.dataset.usedPlaceholder) {
                                    e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
                                    e.target.dataset.usedPlaceholder = 'true';
                                    handleImageLoad(); // Mark as loaded
                                }
                                return;
                            }

                            // Track retry count
                            const retryCount = parseInt(e.target.dataset.retryCount || '0', 10) + 1;
                            e.target.dataset.retryCount = retryCount;

                            console.warn(`Retry ${retryCount} for high-res image:`, fullImageUrl);

                            // Add a small delay before retrying to avoid rate limits
                            setTimeout(() => {
                                // Add cache-busting for retries
                                const cacheBuster = new Date().getTime();

                                // If it's a Firebase Storage URL (either production or emulator), add cache busting
                                if (fullImageUrl && (fullImageUrl.includes('storage.googleapis.com') ||
                                                   fullImageUrl.includes('localhost:9199'))) {
                                    e.target.src = fullImageUrl + (fullImageUrl.includes('?') ? `&cb=${cacheBuster}` : `?cb=${cacheBuster}`);
                                }
                                // If it's a Google Drive URL, use the file ID approach
                                else {
                                    const fileId = originalFileId || (artwork?.imageUrl?.match(/[-\w]{25,}/) || [])[0];
                                    if (fileId) {
                                        // Use w0 parameter to get the original size image without cropping
                                        e.target.src = `https://lh3.googleusercontent.com/d/${fileId}=w0?cb=${cacheBuster}`;
                                    } else if (artwork?.imageUrl) {
                                        e.target.src = artwork.imageUrl + (artwork.imageUrl.includes('?') ? `&cb=${cacheBuster}` : `?cb=${cacheBuster}`);
                                    }
                                }
                            }, 1500 * retryCount); // Increasing delay for each retry
                        }}
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                        onDoubleClick={handleDoubleClick}
                        draggable="false"
                    />
                </div>

                <div style={modalStyles.imageInfo}>
                    <div style={modalStyles.title}>{artwork.itemName}</div>
                    <div style={modalStyles.details}>
                        {`${artwork.dimensions.height}x${artwork.dimensions.width}, ${artwork.medium}`}
                    </div>
                    {favoriteCount !== undefined && (
                        <div style={modalStyles.favoriteCount}>
                            <Award size={16} color="#ffcc00" style={modalStyles.favoriteIcon} />
                            <span>{favoriteCount} favorites</span>
                        </div>
                    )}
                    {commentCount !== undefined && commentCount > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginTop: '8px',
                                color: '#ffffff',
                                cursor: onCommentClick ? 'pointer' : 'default'
                            }}
                            onClick={(e) => {
                                if (onCommentClick) {
                                    e.stopPropagation();
                                    onCommentClick();
                                }
                            }}
                        >
                            <MessageSquare
                                size={16}
                                color="#ffffff"
                                style={{ marginRight: '5px' }}
                            />
                            <span>{commentCount} comment{commentCount !== 1 ? 's' : ''}</span>
                        </div>
                    )}
                    {isFavorite !== undefined && onToggleFavorite && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginTop: '8px',
                                cursor: 'pointer'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite();
                            }}
                        >
                            <Heart
                                size={16}
                                color={isFavorite ? '#ff0000' : '#ffffff'}
                                fill={isFavorite ? '#ff0000' : 'transparent'}
                                style={{ marginRight: '5px' }}
                            />
                            <span>{isFavorite ? 'Remove from favorites' : 'Add to favorites'}</span>
                        </div>
                    )}
                </div>

                <div style={modalStyles.controls}>
                    <button
                        style={{
                            ...modalStyles.controlButton,
                            ...(hoveredButton === 'zoomIn' ? modalStyles.controlButtonHover : {})
                        }}
                        onClick={handleZoomIn}
                        onMouseEnter={() => setHoveredButton('zoomIn')}
                        onMouseLeave={() => setHoveredButton(null)}
                    >
                        <ZoomIn size={20} />
                    </button>
                    <button
                        style={{
                            ...modalStyles.controlButton,
                            ...(hoveredButton === 'zoomOut' ? modalStyles.controlButtonHover : {})
                        }}
                        onClick={handleZoomOut}
                        onMouseEnter={() => setHoveredButton('zoomOut')}
                        onMouseLeave={() => setHoveredButton(null)}
                    >
                        <ZoomOut size={20} />
                    </button>
                    <button
                        style={{
                            ...modalStyles.controlButton,
                            ...(hoveredButton === 'rotate' ? modalStyles.controlButtonHover : {})
                        }}
                        onClick={handleRotate}
                        onMouseEnter={() => setHoveredButton('rotate')}
                        onMouseLeave={() => setHoveredButton(null)}
                    >
                        <RotateCw size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageDetailModal;