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
        transition: 'all 300ms ease-in-out',
        position: 'relative',
        backgroundColor: 'transparent',
        boxSizing: 'border-box',
        zIndex: 2,
        willChange: 'transform, opacity',
    },
    tileLabel: {
        display: 'none',
        fontFamily: "'Poiret One', sans-serif",
        color: '#E5E5E5',
        fontSize: '0.875rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        pointerEvents: 'none',
    },
    visibleLabel: {
        display: 'block',
    },
    activeTile: {
        cursor: 'pointer',
    },
    inactiveTile: {
        cursor: 'default',
        opacity: 0.5,
    },
    animationOverlay: {
        position: 'absolute',
        width: calcSize(2),
        height: calcSize(2),
        zIndex: 1,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    animationContent: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    page: {
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'black',
        color: '#E5E5E5',
        zIndex: 50,
    },
    pageTitle: {
        fontFamily: "'Poiret One', sans-serif",
        fontSize: '4rem',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
    },

    // Navigation page variants (home)
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

    // Content page variants
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