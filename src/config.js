// config.js
import { Gallery } from './pages/Gallery';
import { Editable } from './pages/Editable';

// Grid Configuration
export const TILE_SIZE = 96;
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
            galleryFilter: ['lavanic', 'bear'] // Updated to use tag array
        }
    },
    'g1': {
        title: 'Clarity',
        path: '/clarity',
        component: Gallery,
        props: {
            title: 'Clarity',
            galleryFilter: ['scroll', 'ink'] // Updated to use tag array
        }
    },
    'b1': {
        title: 'Irony',
        path: '/irony',
        component: Gallery,
        props: {
            title: 'Irony',
            galleryFilter: ['abstract', 'red']
        }
    },
    'y1': {
        title: 'You&Me',
        path: '/youme',
        component: Editable,
        props: {
            title: 'You&Me',
            image: 'public/Haven.jpeg',
            textFile: 'public/ArtistBio.html'
        }
    },
    'r2': {
        title: 'Light',
        path: '/r2',
        component: Gallery,
        props: {
            title: 'Light/Intuitive',
            galleryFilter: ['intuative','light']
        }
    },
    'r3': {
        title: 'Atlanta',
        path: '/r3',
        component: Gallery,
        props: {
            title: 'Atlanta',
            galleryFilter: ['atlanta']
        }
    },
    'r4': {
        title: 'Stomach',
        path: '/r4',
        component: Gallery,
        props: {
            title: 'Cat Series',
            galleryFilter: ['cat']
        }
    },
    'r5': {
        title: 'Weaving',
        path: '/weaving',
        component: Gallery,
        props: {
            title: 'r5',
            galleryFilter: ['weaving','fabric']
        }
    },
    'r6': {
        title: 'Leaves',
        path: '/leaves',
        component: Gallery,
        props: {
            title: 'Leaves/Trees',
            galleryFilter: ['leaves','tree','forest']
        }
    },
    'r7': {
        title: 'Devotional',
        path: '/devotional',
        component: Gallery,
        props: {
            title: 'Devotional',
            galleryFilter: ['devotional']
        }
    },
    'r8': {
        title: 'Protein',
        path: '/protein',
        component: Gallery,
        props: {
            title: 'Protein',
            galleryFilter: ['protein']
        }
    },
    'r9': {
        title: 'R9',
        path: '/r9',
        component: Gallery,
        props: {
            title: 'r9',
            galleryFilter: ['SCHOOL'] // Kept as single item array for backward compatibility
        }
    },
    'y2': {
        title: 'Favorites',
        path: '/favorites',
        component: Gallery,
        props: {
            title: 'Favorites',
            galleryFilter: 'SELECTED' // Keep this special case as is
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

export const TILE_LABELS = {
    'r1': PAGES['r1'] ? PAGES['r1'].title : 'r1',
    'g1': PAGES['g1'] ? PAGES['g1'].title : 'g1',
    'b1': PAGES['b1'] ? PAGES['b1'].title : 'b1',
    'y1': PAGES['y1'] ? PAGES['y1'].title : 'y1',
    'r2': PAGES['r2'] ? PAGES['r2'].title : "r2",
    'r3': PAGES['r3'] ? PAGES['r3'].title : "r3",
    'r4': PAGES['r4'] ? PAGES['r4'].title : "r4",
    'r5': PAGES['r5'] ? PAGES['r5'].title : "r5",
    'r6': PAGES['r6'] ? PAGES['r6'].title : "r6",
    'r7': PAGES['r7'] ? PAGES['r7'].title : "r7",
    'r8': PAGES['r8'] ? PAGES['r8'].title : "r8",
    'r9': PAGES['r9'] ? PAGES['r9'].title : "r9",
    'g2': PAGES['g2'] ? PAGES['g2'].title : "g2",
    'g3': PAGES['g3'] ? PAGES['g3'].title : "g3",
    'g4': PAGES['g4'] ? PAGES['g4'].title : "g4",
    'g5': PAGES['g5'] ? PAGES['g5'].title : "g5",
    'g6': PAGES['g6'] ? PAGES['g6'].title : "g6",
    'g7': PAGES['g7'] ? PAGES['g7'].title : "g7",
    'g8': PAGES['g8'] ? PAGES['g8'].title : "g8",
    'g9': PAGES['g9'] ? PAGES['g9'].title : "g9",
    'b2': PAGES['b2'] ? PAGES['b2'].title : "b2",
    'b3': PAGES['b3'] ? PAGES['b3'].title : "b3",
    'b4': PAGES['b4'] ? PAGES['b4'].title : "b4",
    'b5': PAGES['b5'] ? PAGES['b5'].title : "b5",
    'b6': PAGES['b6'] ? PAGES['b6'].title : "b6",
    'b7': PAGES['b7'] ? PAGES['b7'].title : "b7",
    'b8': PAGES['b8'] ? PAGES['b8'].title : "b8",
    'b9': PAGES['b9'] ? PAGES['b9'].title : "b9",
    'y2': PAGES['y2'] ? PAGES['y2'].title : "y2",
    'y3': PAGES['y3'] ? PAGES['y3'].title : "y3",
    'y4': PAGES['y4'] ? PAGES['y4'].title : "y4",
    'y5': PAGES['y5'] ? PAGES['y5'].title : "y5",
    'y6': PAGES['y6'] ? PAGES['y6'].title : "y6",
    'y7': PAGES['y7'] ? PAGES['y7'].title : "y7",
    'y8': PAGES['y8'] ? PAGES['y8'].title : "y8",
    'y9': PAGES['y9'] ? PAGES['y9'].title : "y9"
};

