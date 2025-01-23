import { GRID_LAYOUT, TILE_LABELS, EXPANSION_SETS, INITIAL_ACTIVE_TILES } from '../config.js';

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

const findTileInGrid = (tileId) => {
    for (let row = 0; row < GRID_LAYOUT.length; row++) {
        for (let col = 0; col < GRID_LAYOUT[row].length; col++) {
            if (GRID_LAYOUT[row][col] === tileId) {
                return [row, col];
            }
        }
    }
    return null;
};

// Find the position of all tiles in an expansion set
const findExpansionSetPositions = (sourceId) => {
    if (!EXPANSION_SETS[sourceId]) return [];

    // Get all tiles in the expansion set including the source
    const expansionTiles = [...EXPANSION_SETS[sourceId], sourceId];

    // Find positions for all tiles
    return expansionTiles
        .map(tileId => ({
            id: tileId,
            position: findTileInGrid(tileId)
        }))
        .filter(tile => tile.position !== null);
};

export const getExpansionOrigin = (sourceId) => {
    // Get positions of all tiles in the expansion set
    const tilePositions = findExpansionSetPositions(sourceId);
    if (tilePositions.length === 0) return [0, 0];

    // Find the top-left most position
    const topLeftPosition = tilePositions.reduce((topLeft, current) => {
        const [row, col] = current.position;
        if (!topLeft || row < topLeft[0] || (row === topLeft[0] && col < topLeft[1])) {
            return [row, col];
        }
        return topLeft;
    }, null);

    return topLeftPosition || [0, 0];
};

export const calculateActiveTiles = (hoveredTiles) => {
    const newActiveTiles = new Set(INITIAL_ACTIVE_TILES);

    // Helper to find source tiles for a given target
    const findSourceTiles = (targetTile) => {
        return Object.entries(EXPANSION_SETS)
            .filter(([_, targets]) => targets.includes(targetTile))
            .map(([source]) => source);
    };

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
            if (EXPANSION_SETS[source]) {
                EXPANSION_SETS[source].forEach(target => newActiveTiles.add(target));
            }
        });
    });

    return newActiveTiles;
};

export const getTileLabel = (id) => TILE_LABELS[id] || '';