import { GRID_LOCATIONS, TILE_LABELS, EXPANSION_SETS, INITIAL_ACTIVE_TILES } from '../config.js';

export const getAnimationType = (filename) => {
    if (!filename) return null;
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
        case 'svg': return 'svg';
        case 'json': return 'lottie';
        case 'mp4': return 'video';
        default: return null;
    }
};

export const getExpansionOrigin = (sourceId) => {
    if (!GRID_LOCATIONS[sourceId]) return [0, 0];

    const [row, col] = GRID_LOCATIONS[sourceId];
    const quadrant = sourceId.charAt(0);

    switch(quadrant) {
        case 'r': return [row - 1, col - 1];
        case 'g': return [row - 1, col];
        case 'b': return [row, col];
        case 'y': return [row, col - 1];
        default: return [row, col];
    }
};

export const calculateActiveTiles = (hoveredTiles) => {
    const newActiveTiles = new Set(INITIAL_ACTIVE_TILES);

    // Helper to find source tiles for a given target
    const findSourceTiles = (targetTile) => {
        return Object.entries(EXPANSION_SETS)
            .filter(([_, targets]) => targets.includes(targetTile))
            .map(([source]) => source);
    };

    // For each hovered tile
    hoveredTiles.forEach(tile => {
        // If it's an expansion source, add its targets
        if (EXPANSION_SETS[tile]) {
            EXPANSION_SETS[tile].forEach(target => newActiveTiles.add(target));
        }

        // Find and add any source tiles
        const sources = findSourceTiles(tile);
        sources.forEach(source => newActiveTiles.add(source));

        // For each source, also add its other targets
        sources.forEach(source => {
            EXPANSION_SETS[source].forEach(target => newActiveTiles.add(target));
        });
    });

    return newActiveTiles;
};

export const getTileLabel = (id) => TILE_LABELS[id] || id;