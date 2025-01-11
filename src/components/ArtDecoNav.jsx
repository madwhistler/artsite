import React, { useState, useEffect, useRef } from 'react';
import { Player as LottiePlayer } from '@lottiefiles/react-lottie-player';

const TILE_SIZE = 140;
const TILE_OVERLAP = 6; // 2px on each side
const GRID_SIZE = 6;

const calcSize = (multiplier = 1) => `${(TILE_SIZE * multiplier)}px`;
const calcPosition = (units) => `${(TILE_SIZE * units)}px`;

// Core layout styles that require precise pixel control
const styles = {
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
        margin: `-${TILE_OVERLAP/2}px`,  // Negative margin to create overlap
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
        display: 'none', // Hide labels by default
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

const INITIAL_ACTIVE_TILES = ['r1', 'g1', 'b1', 'y1'];

const GRID_LOCATIONS = {
    'r1': [2, 2], 'r2': [2, 1], 'r3': [1, 1], 'r4': [1, 2],
    'g1': [2, 3], 'g2': [1, 3], 'g3': [1, 4], 'g4': [2, 4],
    'b1': [3, 3], 'b2': [3, 4], 'b3': [4, 4], 'b4': [4, 3],
    'y1': [3, 2], 'y2': [4, 2], 'y3': [4, 1], 'y4': [3, 1]
};

const getAnimationType = (filename) => {
    if (!filename) return null;
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
        case 'svg': return 'svg';
        case 'json': return 'lottie';
        case 'mp4': return 'video';
        default: return null;
    }
};

const getExpansionOrigin = (sourceId) => {
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

const getLabelText = (id) => {
    const labels = {
        'r1': 'CREATING',
        'g1': 'GIVING',
        'b1': 'SUSTAINING',
        'y1': 'CONNECTING'
    };
    return labels[id] || id;
};

const AnimationContent = ({ type, content, key }) => {
    if (!content) return null;

    const contentStyle = {
        ...styles.animationContent,
    };

    switch (type) {
        case 'svg':
            return (
                <div
                    key={key}
                    style={contentStyle}
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            );
        case 'lottie':
            return (
                <LottiePlayer
                    key={key}
                    style={contentStyle}
                    src={content}
                    loop
                    autoplay
                />
            );
        case 'video':
            return (
                <video
                    key={key}
                    style={contentStyle}
                    autoPlay
                    loop
                    muted
                    playsInline
                >
                    <source src={content} type="video/mp4" />
                </video>
            );
        default:
            return null;
    }
};

const GridTile = ({
                      id,
                      isActive,
                      isExpansionSource,
                      isExpansionTarget,
                      isHighlighted,
                      onHover,
                      onLeave
                  }) => {
    const tileStyle = {
        ...styles.tile,
        ...(isActive ? styles.activeTile : styles.inactiveTile),
        transform: isExpansionTarget && isHighlighted ? 'scale(0.95)' : 'scale(1)',
    };

    const labelStyle = {
        ...styles.tileLabel,
        ...(INITIAL_ACTIVE_TILES.includes(id) ? styles.visibleLabel : {})
    };

    const handleHover = () => {
        if (isActive) {
            onHover(id);
        }
    };

    return (
        <div
            style={tileStyle}
            onMouseEnter={handleHover}
            onMouseLeave={onLeave}
        >
            <span style={labelStyle}>{getLabelText(id)}</span>
        </div>
    );
};

const AnimationOverlay = ({ animation, sourceId, isVisible }) => {
    const [animationData, setAnimationData] = useState(null);

    useEffect(() => {
        const loadAnimation = async () => {
            if (!sourceId || !isVisible || !animation) return;

            const type = getAnimationType(animation);
            if (!type) return;

            try {
                if (type === 'svg') {
                    const response = await fetch(animation);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const content = await response.text();
                    setAnimationData({ type, content });
                } else {
                    setAnimationData({ type, content: animation });
                }
            } catch (error) {
                console.error('Error loading animation:', error);
                setAnimationData(null);
            }
        };

        loadAnimation();
    }, [sourceId, isVisible, animation]);

    if (!isVisible || !GRID_LOCATIONS[sourceId] || !animationData) return null;

    const [row, col] = getExpansionOrigin(sourceId);
    const overlayStyle = {
        ...styles.animationOverlay,
        top: calcPosition(row),
        left: calcPosition(col),
    };

    return (
        <div style={overlayStyle}>
            <AnimationContent
                {...animationData}
                key={sourceId}
            />
        </div>
    );
};

export const ArtDecoNav = () => {
    const [hoveredSet, setHoveredSet] = useState(new Set());
    const [activeSource, setActiveSource] = useState(null);
    const [activeTiles, setActiveTiles] = useState(new Set(INITIAL_ACTIVE_TILES));

    const expansionSets = {
        'r1': ['r2', 'r3', 'r4'], 'r2': ['r5', 'r6', 'r3'],
        'r3': ['r6', 'r7', 'r8'], 'r4': ['r3', 'r8', 'r9'],
        'g1': ['g2', 'g3', 'g4'], 'g2': ['g5', 'g6', 'g3'],
        'g3': ['g6', 'g7', 'g8'], 'g4': ['g3', 'g8', 'g9'],
        'b1': ['b2', 'b3', 'b4'], 'b2': ['b5', 'b6', 'b3'],
        'b3': ['b6', 'b7', 'b8'], 'b4': ['b3', 'b8', 'b9'],
        'y1': ['y2', 'y3', 'y4'], 'y2': ['y5', 'y6', 'y3'],
        'y3': ['y6', 'y7', 'y8'], 'y4': ['y3', 'y8', 'y9']
    };

    const animationFiles = {
        'r1': '/Quadrant_1.mp4', 'r2': '/Quadrant_1.mp4',
        'r3': '/infinity-loop.json', 'r4': '/Quadrant_1.mp4',
        'g1': '/Quadrant_2.mp4', 'g2': '/Quadrant_2.mp4',
        'g3': '/infinity-loop.json', 'g4': '/Quadrant_2.mp4',
        'b1': '/Quadrant_3.mp4', 'b2': '/Quadrant_3.mp4',
        'b3': '/infinity-loop.json', 'b4': '/Quadrant_3.mp4',
        'y1': '/Quadrant_4.mp4', 'y2': '/Quadrant_4.mp4',
        'y3': '/infinity-loop.json', 'y4': '/Quadrant_4.mp4'
    };

    const grid = [
        ['r7', 'r8', 'r9', 'g5', 'g6', 'g7'],
        ['r6', 'r3', 'r4', 'g2', 'g3', 'g8'],
        ['r5', 'r2', 'r1', 'g1', 'g4', 'g9'],
        ['y9', 'y4', 'y1', 'b1', 'b2', 'b5'],
        ['y8', 'y3', 'y2', 'b4', 'b3', 'b6'],
        ['y7', 'y6', 'y5', 'b9', 'b8', 'b7']
    ];

    const calculateActiveTiles = (hoveredTiles) => {
        const newActiveTiles = new Set(INITIAL_ACTIVE_TILES);

        // Helper to find source tiles for a given target
        const findSourceTiles = (targetTile) => {
            return Object.entries(expansionSets)
                .filter(([_, targets]) => targets.includes(targetTile))
                .map(([source]) => source);
        };

        // For each hovered tile
        hoveredTiles.forEach(tile => {
            // If it's an expansion source, add its targets
            if (expansionSets[tile]) {
                expansionSets[tile].forEach(target => newActiveTiles.add(target));
            }

            // Find and add any source tiles
            const sources = findSourceTiles(tile);
            sources.forEach(source => newActiveTiles.add(source));

            // For each source, also add its other targets
            sources.forEach(source => {
                expansionSets[source].forEach(target => newActiveTiles.add(target));
            });
        });

        return newActiveTiles;
    };

    const handleHover = (tileId) => {
        if (expansionSets[tileId]) {
            // Handle hover on expansion source
            const expansionTargets = expansionSets[tileId];
            const newHoveredSet = new Set([tileId, ...expansionTargets]);
            setHoveredSet(newHoveredSet);
            setActiveSource(tileId);
            setActiveTiles(calculateActiveTiles(newHoveredSet));
        } else {
            // Handle hover on expansion target
            const sourceId = Object.entries(expansionSets)
                .find(([_, targets]) => targets.includes(tileId))?.[0];

            if (sourceId) {
                const expansionTargets = expansionSets[sourceId];
                const newHoveredSet = new Set([sourceId, ...expansionTargets]);
                setHoveredSet(newHoveredSet);
                setActiveSource(sourceId);
                setActiveTiles(calculateActiveTiles(newHoveredSet));
            } else if (INITIAL_ACTIVE_TILES.includes(tileId)) {
                const newHoveredSet = new Set([tileId]);
                setHoveredSet(newHoveredSet);
                setActiveSource(tileId);
                setActiveTiles(calculateActiveTiles(newHoveredSet));
            }
        }
    };

    const handleLeave = () => {
        setHoveredSet(new Set());
        setActiveSource(null);
        setActiveTiles(new Set(INITIAL_ACTIVE_TILES));
    };

    return (
        <div style={styles.container}>
            <div style={styles.grid}>
                {grid.map((row, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                        {row.map((tile, colIndex) => (
                            <GridTile
                                key={`${rowIndex}-${colIndex}`}
                                id={tile}
                                isActive={activeTiles.has(tile)}
                                isExpansionSource={expansionSets[tile] !== undefined}
                                isExpansionTarget={Object.values(expansionSets)
                                    .some(set => set.includes(tile))}
                                isHighlighted={hoveredSet.has(tile)}
                                onHover={handleHover}
                                onLeave={handleLeave}
                            />
                        ))}
                    </React.Fragment>
                ))}
                {activeSource && (
                    <AnimationOverlay
                        animation={animationFiles[activeSource]}
                        sourceId={activeSource}
                        isVisible={true}
                    />
                )}
            </div>
        </div>
    );
};