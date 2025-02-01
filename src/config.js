// Import page components directly
import { Gallery } from './pages/Gallery';

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
        component: Gallery,
        props: {
            title: 'Beauty',
            galleryFilter: 'STUDY'
        }
    },
    'g1': {
        title: 'Clarity',
        path: '/clarity',
        component: Gallery,
        props: {
            title: 'Clarity',
            galleryFilter: 'SCROLL'
        }
    },
    'b1': {
        title: 'Irony',
        path: '/irony',
        component: Gallery,
        props: {
            title: 'Irony',
            galleryFilter: 'DEVO'
        }
    },
    'y1': {
        title: 'Ignorance',
        path: '/ignorance',
        component: Gallery,
        props: {
            title: 'Ignorance',
            galleryFilter: 'PRINT'
        }
    }
};

// Animation Types
export const ANIMATION_TYPES = {
    TILE: 'tile',           // Single tile idle animation
    EXPANSION: 'expansion', // Expansion animation covering multiple tiles
    CONTRACTION: 'contraction', // Reverse of expansion animation
    BACKGROUND: 'background' // Full background animation
};

// Animation Definitions
export const ANIMATIONS = {
    'r1': [
        { type: ANIMATION_TYPES.TILE, src: '/Green_Idle.mp4' },
        { type: ANIMATION_TYPES.EXPANSION, src: '/Green_Up-left.mp4' },
        { type: ANIMATION_TYPES.CONTRACTION, src: '/Green_Up-left_Reverse.mp4' },
    ],
    'r2': [
        { type: ANIMATION_TYPES.EXPANSION, src: '/Green_Down-left.mp4' },
        { type: ANIMATION_TYPES.CONTRACTION, src: '/Green_Down-left_Reverse.mp4' }
    ],
    'r3': [
        { type: ANIMATION_TYPES.EXPANSION, src: '/Green_Up-left.mp4' },
        { type: ANIMATION_TYPES.CONTRACTION, src: '/Green_Up-left_Reverse.mp4' },
        { type: ANIMATION_TYPES.BACKGROUND, src: '/Mihu_Frame_.mp4' }
    ],
    'r4': [
        { type: ANIMATION_TYPES.EXPANSION, src: '/Green_Up-right.mp4' },
        { type: ANIMATION_TYPES.CONTRACTION, src: '/Green_Up-right_Reverse.mp4' }
    ],
    'g1': [
        { type: ANIMATION_TYPES.TILE, src: '/Blue_Idle.mp4' },
        { type: ANIMATION_TYPES.EXPANSION, src: '/Blue_Up-right.mp4' },
        { type: ANIMATION_TYPES.CONTRACTION, src: '/Blue_Up-right_Reverse.mp4' },
    ],
    'g2': [
        { type: ANIMATION_TYPES.EXPANSION, src: '/Blue_Up-left.mp4' },
        { type: ANIMATION_TYPES.CONTRACTION, src: '/Blue_Up-left_Reverse.mp4' }
    ],
    'g3': [
        { type: ANIMATION_TYPES.EXPANSION, src: '/Blue_Up-right.mp4' },
        { type: ANIMATION_TYPES.CONTRACTION, src: '/Blue_Up-right_Reverse.mp4' },
        { type: ANIMATION_TYPES.BACKGROUND, src: '/Mihu_Frame_.mp4' }
    ],
    'g4': [
        { type: ANIMATION_TYPES.EXPANSION, src: 'Blue_Down-right.mp4' },
        { type: ANIMATION_TYPES.CONTRACTION, src: '/Blue_Down-right_Reverse.mp4' }
    ],
    'b1': [
        { type: ANIMATION_TYPES.TILE, src: '/Pink_Idle.mp4' },
        { type: ANIMATION_TYPES.EXPANSION, src: '/Pink_Down-right.mp4' },
        { type: ANIMATION_TYPES.CONTRACTION, src: '/Pink_Down-right_Reverse.mp4' },
    ],
    'b2': [
        { type: ANIMATION_TYPES.EXPANSION, src: '/Pink_Up-right.mp4' },
        { type: ANIMATION_TYPES.CONTRACTION, src: '/Pink_Up-right_Reverse.mp4' }
    ],
    'b3': [
        { type: ANIMATION_TYPES.EXPANSION, src: '/Pink_Down-right.mp4' },
        { type: ANIMATION_TYPES.CONTRACTION, src: '/Pink_Down-right_Reverse.mp4' },
        { type: ANIMATION_TYPES.BACKGROUND, src: '/Mihu_Frame_.mp4' }
    ],
    'b4': [
        { type: ANIMATION_TYPES.EXPANSION, src: '/Pink_Down-left.mp4' },
        { type: ANIMATION_TYPES.CONTRACTION, src: '/Pink_Down-left_Reverse.mp4' }
    ],
    'y1': [
        { type: ANIMATION_TYPES.TILE, src: '/Orange_Idle.mp4' },
        { type: ANIMATION_TYPES.EXPANSION, src: '/Orange_Down-left.mp4' },
        { type: ANIMATION_TYPES.CONTRACTION, src: '/Orange_Bottom-left_Reverse.mp4' },
    ],
    'y2': [
        { type: ANIMATION_TYPES.EXPANSION, src: '/Orange_Down-right.mp4' },
        { type: ANIMATION_TYPES.CONTRACTION, src: '/Orange_Down-right_Reverse.mp4' },
     ],
    'y3': [
        { type: ANIMATION_TYPES.EXPANSION, src: '/Orange_Down-left.mp4' },
        { type: ANIMATION_TYPES.CONTRACTION, src: '/Orange_Down-left_Reverse.mp4' },
        { type: ANIMATION_TYPES.BACKGROUND, src: '/Mihu_Frame_.mp4' }
    ],
    'y4': [
        { type: ANIMATION_TYPES.EXPANSION, src: '/Orange_Up-left.mp4' },
        { type: ANIMATION_TYPES.CONTRACTION, src: '/Orange_Up-left_Reverse.mp4' }
    ],
};

// Initial Active Tiles - only the core tiles are initially active
export const INITIAL_ACTIVE_TILES = CORE_TILES;

// Grid Layout and Expansion Sets remain the same
export const GRID_LOCATIONS = {
    'r1': [2, 2], 'r2': [2, 1], 'r3': [1, 1], 'r4': [1, 2],
    'g1': [2, 3], 'g2': [1, 3], 'g3': [1, 4], 'g4': [2, 4],
    'b1': [3, 3], 'b2': [3, 4], 'b3': [4, 4], 'b4': [4, 3],
    'y1': [3, 2], 'y2': [4, 2], 'y3': [4, 1], 'y4': [3, 1]
};

export const EXPANSION_SETS = {
    'r1': ['r3', 'r4', 'r1', 'r2'],
    'r2': ['r5', 'r2', 'y4', 'y9'],
    'r3': ['r7', 'r8', 'r3', 'r6'],
    'r4': ['r9', 'r4', 'g2', 'g5'],
    'g1': ['g2', 'g3', 'g4', 'g1'],
    'g2': ['r9', 'g5', 'g2', 'r4'],
    'g3': ['g6', 'g7', 'g3', 'g8'],
    'g4': ['g4', 'g9', 'b2', 'b5'],
    'b1': ['b1', 'b3', 'b4', 'b2'],
    'b2': ['g4', 'b5', 'b2', 'g9'],
    'b3': ['b3', 'b7', 'b8', 'b6'],
    'b4': ['y2', 'b9', 'b4', 'y5'],
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

// Tile Labels - Now derived from PAGES where possible
export const TILE_LABELS = {
    'r1': '',
    'g1': '',
    'b1': '',
    'y1': '',
    'r2': "Overlap!",
    'r3': "Textiles",
    'r4': "Printmaking",
    'r5': "Overlap!",
    'y4': "Overlap!",
    'y9': "Overlap!"
};