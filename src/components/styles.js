import { TILE_SIZE, TILE_OVERLAP, GRID_SIZE } from '../config.js';

const calcSize = (multiplier = 1) => `${(TILE_SIZE * multiplier)}px`;
const calcPosition = (units) => `${(TILE_SIZE * units)}px`;

export const styles = {
    // Container and Grid Styles
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

    // Tile Styles
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
        zIndex: 2,
    },
    tileLabel: {
        display: 'none',
        fontFamily: "'Poiret One', sans-serif",
        color: '#E5E5E5',
        fontSize: '0.875rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
    },
    visibleLabel: {
        display: 'block',
    },
    activeTile: {
        cursor: 'pointer',
    },
    inactiveTile: {
        cursor: 'default',
    },

    // Animation Overlay Styles
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
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    expansionAnimation: {
        width: calcSize(2),
        height: calcSize(2),
        zIndex: 3,
    },
    contractionAnimation: {
        width: calcSize(2),
        height: calcSize(2),
        zIndex: 3,
    },
    backgroundAnimation: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1,
        overflow: 'hidden',
    },

    // Animation Content Styles
    animationContent: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        objectFit: 'cover',
    },
    backgroundContent: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center',
    },

    // Page Styles
    page: {
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000000',
        color: '#FFFFFF',
    },
    pageTitle: {
        fontFamily: "'Poiret One', sans-serif",
        fontSize: '2.5rem',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        marginBottom: '2rem',
    },

    // Navigation Page Variants
    navPageVariants: {
        initial: (isBack) => ({
            x: isBack ? '-100%' : '100%',
            opacity: 0
        }),
        animate: {
            x: 0,
            opacity: 1,
            transition: {
                type: 'tween',
                duration: 0.5,
                ease: 'easeInOut'
            }
        },
        exit: (isBack) => ({
            x: isBack ? '100%' : '-100%',
            opacity: 0,
            transition: {
                type: 'tween',
                duration: 0.5,
                ease: 'easeInOut'
            }
        })
    },

    // Content Page Variants
    contentPageVariants: {
        initial: (isBack) => ({
            x: isBack ? '-100%' : '100%',
            opacity: 0
        }),
        animate: {
            x: 0,
            opacity: 1,
            transition: {
                type: 'tween',
                duration: 0.5,
                ease: 'easeInOut'
            }
        },
        exit: (isBack) => ({
            x: isBack ? '100%' : '-100%',
            opacity: 0,
            transition: {
                type: 'tween',
                duration: 0.5,
                ease: 'easeInOut'
            }
        })
    }
};