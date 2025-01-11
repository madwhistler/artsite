import { TILE_SIZE, TILE_OVERLAP, GRID_SIZE } from '../config.js';

const calcSize = (multiplier = 1) => `${(TILE_SIZE * multiplier)}px`;
const calcPosition = (units) => `${(TILE_SIZE * units)}px`;

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
    }
};