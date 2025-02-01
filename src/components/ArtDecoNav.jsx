import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GridTile } from './GridTile';
import { AnimationContent } from './AnimationContent';
import { styles } from './styles';
import {
    INITIAL_ACTIVE_TILES,
    GRID_LAYOUT,
    EXPANSION_SETS,
    ANIMATIONS,
    ANIMATION_TYPES,
    TILE_SIZE,
    GRID_LOCATIONS
} from '../config';
import { getExpansionOrigin } from './utils';

const getQuadrant = (tileId) => {
    if (typeof tileId !== 'string') return '';
    return tileId.charAt(0);
};

const getQuadrantTiles = (tileId) => {
    const quadrant = getQuadrant(tileId);
    return GRID_LAYOUT.flat().filter(tile => tile && typeof tile === 'string' && tile.startsWith(quadrant));
};

const getAllTilesInQuadrant = (quadrant) => {
    if (!quadrant) return new Set();
    const baseTiles = getQuadrantTiles(quadrant);
    const expansionTiles = new Set();

    baseTiles.forEach(tile => {
        if (EXPANSION_SETS[tile]) {
            EXPANSION_SETS[tile].forEach(target => expansionTiles.add(target));
        }
    });

    return new Set([...baseTiles, ...expansionTiles]);
};

const getTilePosition = (tileId) => {
    return GRID_LOCATIONS[tileId] || [0, 0];
};

const getAnimationStyle = (type, sourceId) => {
    const baseStyle = { ...styles.animationOverlay };

    switch (type) {
        case ANIMATION_TYPES.TILE: {
            const [row, col] = getTilePosition(sourceId);
            return {
                ...baseStyle,
                ...styles.tileAnimation,
                top: `${row * TILE_SIZE}px`,
                left: `${col * TILE_SIZE}px`,
                width: `${TILE_SIZE}px`,
                height: `${TILE_SIZE}px`
            };
        }
        case ANIMATION_TYPES.BACKGROUND:
            return {
                ...baseStyle,
                ...styles.backgroundAnimation
            };
        case ANIMATION_TYPES.EXPANSION:
        case ANIMATION_TYPES.CONTRACTION: {
            const [row, col] = getExpansionOrigin(sourceId);
            return {
                ...baseStyle,
                ...styles.expansionAnimation,
                top: `${row * TILE_SIZE}px`,
                left: `${col * TILE_SIZE}px`,
            };
        }
        default:
            return baseStyle;
    }
};

const AnimationOverlay = ({ animationData, sourceId, isVisible, type, onAnimationEnd }) => {
    const [content, setContent] = useState(null);
    const loadingRef = useRef(false);

    useEffect(() => {
        const loadAnimation = async () => {
            if (!sourceId || !isVisible || !animationData?.src || loadingRef.current) return;

            loadingRef.current = true;
            const fileType = animationData.src.split('.').pop().toLowerCase();
            const animationType = fileType === 'json' ? 'lottie' :
                fileType === 'svg' ? 'svg' :
                    fileType === 'mp4' ? 'video' : null;

            if (!animationType) {
                loadingRef.current = false;
                return;
            }

            try {
                if (animationType === 'svg') {
                    const response = await fetch(animationData.src);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const content = await response.text();
                    setContent({ type: animationType, content });
                } else {
                    setContent({ type: animationType, content: animationData.src });
                }
            } catch (error) {
                console.error('Error loading animation:', error);
                setContent(null);
            } finally {
                loadingRef.current = false;
            }
        };

        loadAnimation();

        return () => {
            loadingRef.current = false;
        };
    }, [sourceId, isVisible, animationData]);

    if (!isVisible || !content) return null;

    const overlayStyle = getAnimationStyle(type, sourceId);

    return (
        <div style={overlayStyle}>
            <AnimationContent
                {...content}
                animationType={type}
                loop={type === ANIMATION_TYPES.TILE || type === ANIMATION_TYPES.BACKGROUND}
                onEnded={type === ANIMATION_TYPES.CONTRACTION ? onAnimationEnd : undefined}
            />
        </div>
    );
};

export const ArtDecoNav = () => {
    const [hoveredTile, setHoveredTile] = useState(null);
    const [activeQuadrants, setActiveQuadrants] = useState(new Set());
    const [activeTiles, setActiveTiles] = useState(new Set(INITIAL_ACTIVE_TILES));
    const [animations, setAnimations] = useState(new Map());
    const animationKeyRef = useRef(0);

    const handleContractionEnd = useCallback((sourceId) => {
        setAnimations(prev => {
            const next = new Map(prev);
            next.delete(sourceId);
            return next;
        });

        if (animations.size <= 1) {
            setActiveQuadrants(new Set());
            setActiveTiles(new Set(INITIAL_ACTIVE_TILES));
            setHoveredTile(null);
        }
    }, [animations.size]);

    const updateActiveStates = useCallback((tileId) => {
        if (!tileId) return;

        const quadrant = getQuadrant(tileId);
        const newActiveTiles = new Set(INITIAL_ACTIVE_TILES);
        const newActiveQuadrants = new Set(activeQuadrants);

        if (INITIAL_ACTIVE_TILES.includes(tileId) || activeQuadrants.has(quadrant)) {
            if (quadrant && !activeQuadrants.has(quadrant)) {
                newActiveQuadrants.add(quadrant);
            }

            newActiveQuadrants.forEach(q => {
                getAllTilesInQuadrant(q).forEach(tile => newActiveTiles.add(tile));
            });

            let newActiveSource = null;
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

            if (newActiveSource) {
                setAnimations(prev => {
                    const next = new Map(prev);

                    // If moving to a center tile, contract ALL current expansions
                    if (INITIAL_ACTIVE_TILES.includes(newActiveSource)) {
                        prev.forEach((state, sourceId) => {
                            if (state.expanding && sourceId !== newActiveSource) {
                                next.set(sourceId, { expanding: false, contracting: true });
                            }
                        });
                    } else {
                        // For non-core tiles, only handle transitions within the same quadrant
                        prev.forEach((state, sourceId) => {
                            if (state.expanding && getQuadrant(sourceId) === quadrant) {
                                next.set(sourceId, { expanding: false, contracting: true });
                            }
                        });
                    }

                    // Set new expansion
                    next.set(newActiveSource, { expanding: true, contracting: false });
                    return next;
                });
            }
        }

        animationKeyRef.current += 1;
        setActiveQuadrants(newActiveQuadrants);
        setActiveTiles(newActiveTiles);
        setHoveredTile(tileId);
    }, [activeQuadrants]);

    const handleLeave = useCallback((tileId) => {
        const leavingQuadrant = getQuadrant(tileId);

        setAnimations(prev => {
            const next = new Map(prev);
            prev.forEach((state, sourceId) => {
                // Start contraction for any expanding animations in the leaving quadrant
                // or if leaving a core tile, contract everything that's expanding
                if (state.expanding && (
                    getQuadrant(sourceId) === leavingQuadrant ||
                    INITIAL_ACTIVE_TILES.includes(tileId)
                )) {
                    next.set(sourceId, { expanding: false, contracting: true });
                }
            });
            return next;
        });
    }, []);

    const renderAnimations = useCallback(() => {
        const allAnimations = [];

        animations.forEach((state, sourceId) => {
            if (!ANIMATIONS[sourceId]) return;

            ANIMATIONS[sourceId].forEach(animation => {
                if (animation.type === ANIMATION_TYPES.TILE && !activeTiles.has(sourceId)) {
                    return;
                }

                if (animation.type === ANIMATION_TYPES.EXPANSION && !state.expanding) {
                    return;
                }

                if (animation.type === ANIMATION_TYPES.CONTRACTION && !state.contracting) {
                    return;
                }

                allAnimations.push(
                    <AnimationOverlay
                        key={`${sourceId}-${animation.type}-${state.expanding ? 'expand' : 'contract'}-${animationKeyRef.current}`}
                        animationData={animation}
                        sourceId={sourceId}
                        type={animation.type}
                        isVisible={true}
                        onAnimationEnd={animation.type === ANIMATION_TYPES.CONTRACTION ?
                            () => handleContractionEnd(sourceId) : undefined}
                    />
                );
            });
        });

        return allAnimations;
    }, [animations, activeTiles, handleContractionEnd]);

    const renderIdleAnimations = useCallback(() => {
        return Array.from(activeTiles).map(tileId => {
            if (!ANIMATIONS[tileId]) return null;

            const tileAnimation = ANIMATIONS[tileId].find(
                animation => animation.type === ANIMATION_TYPES.TILE
            );

            if (!tileAnimation || animations.has(tileId)) return null;

            return (
                <AnimationOverlay
                    key={`${tileId}-idle-${animationKeyRef.current}`}
                    animationData={tileAnimation}
                    sourceId={tileId}
                    type={ANIMATION_TYPES.TILE}
                    isVisible={true}
                />
            );
        });
    }, [activeTiles, animations]);

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
                {renderIdleAnimations()}
                {renderAnimations()}
            </div>
        </div>
    );
};