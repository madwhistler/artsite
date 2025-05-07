import { TILE_SIZE, TILE_OVERLAP, GRID_SIZE } from '../config.js';

const calcSize = (multiplier = 1) => `${(TILE_SIZE * multiplier)}px`;

export const styles = {
    container: {
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'black',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_SIZE}, ${calcSize(1)})`,
        gap: 0,
        position: 'relative',
    },
    tile: {
        width: `${TILE_SIZE + TILE_OVERLAP}px`,
        height: `${TILE_SIZE + TILE_OVERLAP}px`,
        margin: `-${TILE_OVERLAP/2}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 300ms',
        position: 'relative',
        backgroundColor: 'transparent',
        boxSizing: 'border-box',
        zIndex: 20,
    },
    tileLabel: {
        fontFamily: "'Poiret One', sans-serif",
        color: '#E5E5E5',
        fontSize: '0.6rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        textAlign: 'center',
        padding: '2px 4px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '2px',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        zIndex: 100,
    },
    activeTile: {
        cursor: 'pointer',
    },
    inactiveTile: {
        cursor: 'default',
    },
    animationOverlay: {
        position: 'absolute',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    tileAnimation: {
        position: 'absolute',
        zIndex: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    expansionAnimation: {
        width: calcSize(2),
        height: calcSize(2),
        zIndex: 30,
    },
    contractionAnimation: {
        width: calcSize(2),
        height: calcSize(2),
        zIndex: 30,
    },
    backgroundAnimation: {
        position: 'fixed',
        width: '100vw',
        height: '100vh',
        zIndex: 5, // Lower z-index to ensure it appears below grid and tile elements
        overflow: 'visible', // Changed from hidden to visible to prevent truncation
        transformOrigin: 'center center',
        pointerEvents: 'none', // Allow clicking through the animation
    },
    animationContent: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        objectFit: 'contain', // Changed from cover to contain to prevent cropping
        pointerEvents: 'none', // Allow clicking through the animation
        zIndex: 'inherit', // Inherit z-index from parent
    },

    // Position-specific styles for background animations
    backgroundPositionTop: {
        top: 0,
        left: '50%',
        transformOrigin: 'top center',
    },
    backgroundPositionBottom: {
        bottom: 0,
        left: '50%',
        transformOrigin: 'bottom center',
    },
    backgroundPositionLeft: {
        left: 0,
        top: '50%',
        transformOrigin: 'center left',
    },
    backgroundPositionRight: {
        right: 0,
        top: '50%',
        transformOrigin: 'center right',
    },
    backgroundPositionCenter: {
        top: '50%',
        left: '50%',
        transformOrigin: 'center center',
    },
    backgroundContent: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center',
    },

    // Special styles for videos that need to preserve aspect ratio
    preserveAspectRatio: {
        objectFit: 'contain',
        width: 'auto',
        height: 'auto',
        maxWidth: '100%',
        maxHeight: '100%',
    },
};