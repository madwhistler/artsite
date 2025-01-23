// Import page components directly
import { Beauty } from './pages/Beauty';
import { Clarity } from './pages/Clarity';
import { Irony } from './pages/Irony';
import { Ignorance } from './pages/Ignorance';

// Grid Configuration
export const TILE_SIZE = 146;
export const TILE_OVERLAP = 6;
export const GRID_SIZE = 6;

// Core tiles that are initially active
export const CORE_TILES = ['r1', 'g1', 'b1', 'y1'];

// Page Definitions - indexed by tile ID
export const PAGES = {
    'r1': {
        title: 'Beauty',
        path: '/beauty',
        component: Beauty
    },
    'g1': {
        title: 'Clarity',
        path: '/clarity',
        component: Clarity
    },
    'b1': {
        title: 'Irony',
        path: '/irony',
        component: Irony
    },
    'y1': {
        title: 'Ignorance',
        path: '/ignorance',
        component: Ignorance
    }
};

// Initial Active Tiles - only the core tiles are initially active
export const INITIAL_ACTIVE_TILES = CORE_TILES;

// Grid Layout and Expansion Sets
export const GRID_LOCATIONS = {
    'r1': [2, 2], 'r2': [2, 1], 'r3': [1, 1], 'r4': [1, 2],
    'g1': [2, 3], 'g2': [1, 3], 'g3': [1, 4], 'g4': [2, 4],
    'b1': [3, 3], 'b2': [3, 4], 'b3': [4, 4], 'b4': [4, 3],
    'y1': [3, 2], 'y2': [4, 2], 'y3': [4, 1], 'y4': [3, 1]
};

// Updated expansion sets with true top-left tile first
export const EXPANSION_SETS = {
    // Red quadrant
    'r1': ['r3', 'r4', 'r1', 'r2'],
    'r2': ['r5', 'r2', 'y4', 'y9'],
    'r3': ['r7', 'r8', 'r3', 'r6'],
    'r4': ['r9', 'r4', 'g2', 'g5'],

    // Green quadrant
    'g1': ['g2', 'g3', 'g4', 'g1'],
    'g2': ['r9', 'g5', 'g2', 'r4'],
    'g3': ['g6', 'g7', 'g3', 'g8'],
    'g4': ['g4', 'g9', 'b2', 'b5'],

    // Blue quadrant
    'b1': ['b1', 'b3', 'b4', 'b2'],
    'b2': ['g4', 'b5', 'b2', 'g9'],
    'b3': ['b3', 'b7', 'b8', 'b6'],
    'b4': ['y2', 'b9', 'b4', 'y5'],

    // Yellow quadrant
    'y1': ['y4', 'y3', 'y1', 'y2'],
    'y2': ['y2', 'y5', 'b4', 'b9'],
    'y3': ['y8', 'y7', 'y3', 'y6'],
    'y4': ['r5', 'y9', 'y4', 'r2']
};

export const GRID_LAYOUT = [
    ['r7', 'r8', 'r9', 'g5', 'g6', 'g7'],
    ['r6', 'r3', 'r4', 'g2', 'g3', 'g8'],
    ['r5', 'r2', 'r1', 'g1', 'g4', 'g9'],
    ['y9', 'y4', 'y1', 'b1', 'b2', 'b5'],
    ['y8', 'y3', 'y2', 'b4', 'b3', 'b6'],
    ['y7', 'y6', 'y5', 'b9', 'b8', 'b7']
];

export const ANIMATION_FILES = {
    'r1': '/Green_Up-left.mp4', 'r2': '/Green_Down-left.mp4',
    'r3': '/Green_Up-left.mp4', 'r4': '/Green_Up-right.mp4',
    'g1': '/Quadrant_2.mp4', 'g2': '/Quadrant_2.mp4',
    'g3': '/vines.mp4', 'g4': '/Quadrant_2.mp4',
    'b1': '/Pink_Bottom-right.mp4', 'b2': '/Pink_Up-right.mp4',
    'b3': '/Pink_Bottom-right.mp4', 'b4': '/Pink_Down-left.mp4',
    'y1': '/Orange_Bottom-left.mp4', 'y2': '/Orange_Bottom-right.mp4',
    'y3': '/Orange_Bottom-left.mp4', 'y4': '/Orange_Up-right.mp4'
};

// Tile Labels - Now derived from PAGES where possible
export const TILE_LABELS = {
    ...Object.fromEntries(
        Object.entries(PAGES).map(([id, { title }]) => [id, title.toUpperCase()])
    ),
    'r2': "Overlap!",
    'r3': "Textiles",
    'r4': "Printmaking",
    'r5': "Overlap!",
    'y4': "Overlap!",
    'y9': "Overlap!",
};