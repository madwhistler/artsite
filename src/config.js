// Grid Configuration
export const TILE_SIZE = 146;
export const TILE_OVERLAP = 6;
export const GRID_SIZE = 6;

// Initial Active Tiles
export const INITIAL_ACTIVE_TILES = ['r1', 'g1', 'b1', 'y1'];

// Grid Layout and Expansion Sets
export const GRID_LOCATIONS = {
    'r1': [2, 2], 'r2': [2, 1], 'r3': [1, 1], 'r4': [1, 2],
    'g1': [2, 3], 'g2': [1, 3], 'g3': [1, 4], 'g4': [2, 4],
    'b1': [3, 3], 'b2': [3, 4], 'b3': [4, 4], 'b4': [4, 3],
    'y1': [3, 2], 'y2': [4, 2], 'y3': [4, 1], 'y4': [3, 1]
};

export const EXPANSION_SETS = {
    'r1': ['r2', 'r3', 'r4'], 'r2': ['r5', 'r6', 'r3'],
    'r3': ['r6', 'r7', 'r8'], 'r4': ['r3', 'r8', 'r9'],
    'g1': ['g2', 'g3', 'g4'], 'g2': ['g5', 'g6', 'g3'],
    'g3': ['g6', 'g7', 'g8'], 'g4': ['g3', 'g8', 'g9'],
    'b1': ['b2', 'b3', 'b4'], 'b2': ['b5', 'b6', 'b3'],
    'b3': ['b6', 'b7', 'b8'], 'b4': ['b3', 'b8', 'b9'],
    'y1': ['y2', 'y3', 'y4'], 'y2': ['y5', 'y6', 'y3'],
    'y3': ['y6', 'y7', 'y8'], 'y4': ['y3', 'y8', 'y9']
};

export const GRID_LAYOUT = [
    ['r7', 'r8', 'r9', 'g5', 'g6', 'g7'],
    ['r6', 'r3', 'r4', 'g2', 'g3', 'g8'],
    ['r5', 'r2', 'r1', 'g1', 'g4', 'g9'],
    ['y9', 'y4', 'y1', 'b1', 'b2', 'b5'],
    ['y8', 'y3', 'y2', 'b4', 'b3', 'b6'],
    ['y7', 'y6', 'y5', 'b9', 'b8', 'b7']
];

// AnimationContent.jsx Files Configuration
export const ANIMATION_FILES = {
    'r1': '/Quadrant_1.mp4', 'r2': '/Quadrant_1.mp4',
    'r3': '/infinity-loop.json', 'r4': '/Quadrant_1.mp4',
    'g1': '/Quadrant_2.mp4', 'g2': '/Quadrant_2.mp4',
    'g3': '/infinity-loop.json', 'g4': '/Quadrant_2.mp4',
    'b1': '/Quadrant_3.mp4', 'b2': '/Quadrant_3.mp4',
    'b3': '/infinity-loop.json', 'b4': '/Quadrant_3.mp4',
    'y1': '/Quadrant_4.mp4', 'y2': '/Quadrant_4.mp4',
    'y3': '/infinity-loop.json', 'y4': '/Quadrant_4.mp4'
};

// Tile Labels
export const TILE_LABELS = {
    'r1': 'CREATING',
    'g1': 'GIVING',
    'b1': 'SUSTAINING',
    'y1': 'CONNECTING'
};
