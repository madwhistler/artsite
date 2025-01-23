import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GridTile } from './GridTile';
import { AnimationContent } from './AnimationContent';
import { styles } from './styles';
import {
    INITIAL_ACTIVE_TILES,
    GRID_LAYOUT,
    EXPANSION_SETS,
    ANIMATION_FILES,
    TILE_SIZE
} from '../config';
import { getExpansionOrigin } from './utils';

const getQuadrant = (tileId) => tileId?.charAt(0);

const getQuadrantTiles = (tileId) => {
    const quadrant = getQuadrant(tileId);
    return GRID_LAYOUT.flat().filter(tile => tile.startsWith(quadrant));
};

const getAllTilesInQuadrant = (quadrant) => {
    const baseTiles = getQuadrantTiles(quadrant);
    const expansionTiles = new Set();

    baseTiles.forEach(tile => {
        if (EXPANSION_SETS[tile]) {
            EXPANSION_SETS[tile].forEach(target => expansionTiles.add(target));
        }
    });

    return new Set([...baseTiles, ...expansionTiles]);
};

const AnimationOverlay = ({ animation, sourceId, isVisible, key }) => {
    const [animationData, setAnimationData] = useState(null);
    const loadingRef = useRef(false);

    useEffect(() => {
        const loadAnimation = async () => {
            if (!sourceId || !isVisible || !animation || loadingRef.current) return;

            loadingRef.current = true;
            const type = animation.endsWith('.json') ? 'lottie' :
                animation.endsWith('.svg') ? 'svg' :
                    animation.endsWith('.mp4') ? 'video' : null;

            if (!type) {
                loadingRef.current = false;
                return;
            }

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
            } finally {
                loadingRef.current = false;
            }
        };

        loadAnimation();

        return () => {
            loadingRef.current = false;
        };
    }, [sourceId, isVisible, animation]);

    if (!isVisible || !animationData) return null;

    const [row, col] = getExpansionOrigin(sourceId);
    const overlayStyle = {
        ...styles.animationOverlay,
        top: `${row * TILE_SIZE}px`,
        left: `${col * TILE_SIZE}px`
    };

    return (
        <div style={overlayStyle}>
            <div key={`${sourceId}-${key}`}>
                <AnimationContent {...animationData} key={`${sourceId}-${key}`} />
            </div>
        </div>
    );
};

export const ArtDecoNav = () => {
    const [hoveredTile, setHoveredTile] = useState(null);
    const [activeQuadrants, setActiveQuadrants] = useState(new Set());
    const [activeTiles, setActiveTiles] = useState(new Set(INITIAL_ACTIVE_TILES));
    const [activeSource, setActiveSource] = useState(null);
    const animationKeyRef = useRef(0);

    const updateActiveStates = useCallback((tileId) => {
        const quadrant = getQuadrant(tileId);
        const newActiveTiles = new Set(INITIAL_ACTIVE_TILES);
        const newActiveQuadrants = new Set(activeQuadrants);
        let newActiveSource = null;

        if (INITIAL_ACTIVE_TILES.includes(tileId) || activeQuadrants.has(quadrant)) {
            if (quadrant && !activeQuadrants.has(quadrant)) {
                newActiveQuadrants.add(quadrant);
            }

            newActiveQuadrants.forEach(q => {
                getAllTilesInQuadrant(q).forEach(tile => newActiveTiles.add(tile));
            });

            if (EXPANSION_SETS[tileId]) {
                newActiveSource = tileId;
            } else {
                const possibleSources = Object.entries(EXPANSION_SETS)
                    .filter(([source, targets]) =>
                        getQuadrant(source) === quadrant &&
                        targets.includes(tileId)
                    );
                if (possibleSources.length > 0) {
                    newActiveSource = possibleSources[0][0];
                }
            }
        }

        animationKeyRef.current += 1;
        setActiveQuadrants(newActiveQuadrants);
        setActiveTiles(newActiveTiles);
        setActiveSource(newActiveSource);
        setHoveredTile(tileId);
    }, [activeQuadrants]);

    const handleLeave = useCallback(() => {
        setHoveredTile(null);
        setActiveQuadrants(new Set());
        setActiveTiles(new Set(INITIAL_ACTIVE_TILES));
        setActiveSource(null);
    }, []);

    return (
        <div style={styles.container}>
            <div style={styles.grid}>
                {GRID_LAYOUT.map((row, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                        {row.map((tile, colIndex) => (
                            <GridTile
                                key={`${rowIndex}-${colIndex}`}
                                id={tile}
                                isActive={activeTiles.has(tile)}
                                isExpansionSource={EXPANSION_SETS[tile] !== undefined}
                                isExpansionTarget={Object.values(EXPANSION_SETS)
                                    .some(set => set.includes(tile))}
                                isHighlighted={tile === hoveredTile}
                                onHover={updateActiveStates}
                                onLeave={handleLeave}
                            />
                        ))}
                    </React.Fragment>
                ))}
                {activeSource && (
                    <AnimationOverlay
                        animation={ANIMATION_FILES[activeSource]}
                        sourceId={activeSource}
                        isVisible={true}
                        key={animationKeyRef.current}
                    />
                )}
            </div>
        </div>
    );
};