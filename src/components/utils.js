import {
    GRID_LAYOUT,
    TILE_LABELS,
    EXPANSION_SETS,
    INITIAL_ACTIVE_TILES
} from '../config';

export const getAnimationType = (filename) => {
    if (!filename) return null;
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
        case 'svg': return 'svg';
        case 'lottie': return 'lottie';
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

export const getTilePosition = (tileId) => {
    return findTileInGrid(tileId) || [0, 0];
};

export const getQuadrant = (tileId) => {
    if (typeof tileId !== 'string') return '';
    return tileId.charAt(0);
};

export const getQuadrantExpansions = (sourceId) => {
    const quadrant = getQuadrant(sourceId);
    const expansions = new Set();

    Object.entries(EXPANSION_SETS).forEach(([id, targets]) => {
        if (getQuadrant(id) === quadrant) {
            expansions.add(id);
            targets.forEach(target => expansions.add(target));
        }
    });

    return expansions;
};

export const calculateActiveTiles = (hoveredTiles) => {
    const newActiveTiles = new Set(INITIAL_ACTIVE_TILES);

    const findSourceTiles = (targetTile) => {
        return Object.entries(EXPANSION_SETS)
            .filter(([_, targets]) => targets.includes(targetTile))
            .map(([source]) => source);
    };

    hoveredTiles.forEach(tile => {
        if (EXPANSION_SETS[tile]) {
            EXPANSION_SETS[tile].forEach(target => newActiveTiles.add(target));
        }

        const sources = findSourceTiles(tile);
        sources.forEach(source => newActiveTiles.add(source));

        sources.forEach(source => {
            if (EXPANSION_SETS[source]) {
                EXPANSION_SETS[source].forEach(target => newActiveTiles.add(target));
            }
        });
    });

    return newActiveTiles;
};

export const getTileLabel = (id) => TILE_LABELS[id] || '';