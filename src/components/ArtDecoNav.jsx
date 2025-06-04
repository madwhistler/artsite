import React, { useCallback, useState } from 'react';
import { GridTile } from './GridTile';
import { AnimationOverlay } from './AnimationOverlay';
import { TileLabel } from './TileLabel';
import { styles } from './styles';
import './ArtDecoNav.css';
import {
    INITIAL_ACTIVE_TILES,
    GRID_LAYOUT,
    ANIMATIONS,
    ANIMATION_TYPES,
    MAX_CONCURRENT_ANIMATIONS
} from '../config';
import { useAnimationLimiter } from '../hooks/useAnimationLimiter';
import { useNavigationState } from './NavigationState';
import { useNavigationControls } from './NavigationControls';
import { useDeviceDetection } from '../hooks/useDeviceDetection';

export const ArtDecoNav = () => {
    const { isMobile } = useDeviceDetection();
    const [expandedTile, setExpandedTile] = useState(null);
    const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 });
    const navigationState = useNavigationState(INITIAL_ACTIVE_TILES);
    const {
        hoveredTile,
        activeTiles,
        animations,
        animationKeyRef,
        setHoveredTile,
        setAnimations
    } = navigationState;

    // Use animation limiter to control the number of concurrent animations
    const animationLimiter = useAnimationLimiter(
        animations,
        setAnimations,
        MAX_CONCURRENT_ANIMATIONS
    );

    // Assign the animation limiter to the navigation state
    navigationState.animationLimiter = animationLimiter;

    const {
        handleContractionEnd,
        updateActiveStates,
        contractQuadrant,
        getExpansionSet
    } = useNavigationControls(navigationState);

    // Calculate grid offset for mobile recentering based on actual tile positions
    const calculateGridOffset = useCallback((tileId) => {
        if (!isMobile || !tileId) return { x: 0, y: 0 };

        // Find the tile's position in the grid
        let tileRow = -1, tileCol = -1;
        for (let row = 0; row < GRID_LAYOUT.length; row++) {
            for (let col = 0; col < GRID_LAYOUT[row].length; col++) {
                if (GRID_LAYOUT[row][col] === tileId) {
                    tileRow = row;
                    tileCol = col;
                    break;
                }
            }
            if (tileRow !== -1) break;
        }

        if (tileRow === -1 || tileCol === -1) return { x: 0, y: 0 };

        // Only recenter for tiles ending in 2, 3, 4
        const tileNumber = tileId.slice(-1);
        if (!['2', '3', '4'].includes(tileNumber)) {
            return { x: 0, y: 0 }; // Center tiles (ending in 1) return to center
        }

        // Calculate offset based on tile position relative to center (2.5, 2.5)
        const centerRow = 2.5;
        const centerCol = 2.5;

        // If tile is left of center, shift right to show it better
        // If tile is right of center, shift left to show it better
        // If tile is above center, shift down to show it better
        // If tile is below center, shift up to show it better

        let offsetX = 0, offsetY = 0;

        if (tileCol < centerCol) {
            offsetX = 70; // Shift right to show left tiles
        } else if (tileCol > centerCol) {
            offsetX = -70; // Shift left to show right tiles
        }

        if (tileRow < centerRow) {
            offsetY = 70; // Shift down to show top tiles
        } else if (tileRow > centerRow) {
            offsetY = -70; // Shift up to show bottom tiles
        }

        return { x: offsetX, y: offsetY };
    }, [isMobile]);

    const handleLeave = useCallback((tileId) => {
        if (!isMobile) {
            setHoveredTile(null);
        }
    }, [setHoveredTile, isMobile]);

    // Handle hover for desktop - keep existing behavior
    const handleHover = useCallback((tileId) => {
        if (!isMobile) {
            updateActiveStates(tileId);
        }
        // Mobile hover is handled differently (through tap)
    }, [isMobile, updateActiveStates]);

    const handleTap = useCallback((tileId) => {
        if (expandedTile === tileId) {
            // Second tap on same tile - leave it expanded for navigation
            return;
        }

        // First tap or tap on different tile
        if (expandedTile) {
            // Contract previous expansion if exists
            contractQuadrant(expandedTile);
        }

        updateActiveStates(tileId);
        setExpandedTile(tileId);

        // Update grid offset for mobile recentering
        const newOffset = calculateGridOffset(tileId);
        setGridOffset(newOffset);
    }, [expandedTile, contractQuadrant, updateActiveStates, calculateGridOffset]);

    const renderAnimations = useCallback(() => {
        const allAnimations = [];

        animations.forEach((state, sourceId) => {
            if (!ANIMATIONS[sourceId]) return;

            ANIMATIONS[sourceId].forEach(animation => {
                if (animation.type === ANIMATION_TYPES.TILE && !activeTiles.has(sourceId)) return;
                if (animation.type === ANIMATION_TYPES.EXPANSION && !state.expanding) return;
                if (animation.type === ANIMATION_TYPES.CONTRACTION && !state.contracting) return;

                allAnimations.push(
                    <AnimationOverlay
                        key={`${sourceId}-${animation.type}-${state.expanding ? 'expand' : 'contract'}`}
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
                    key={`${tileId}-idle`}
                    animationData={tileAnimation}
                    sourceId={tileId}
                    type={ANIMATION_TYPES.TILE}
                    isVisible={true}
                />
            );
        });
    }, [activeTiles, animations]);

    // Animation limiter is now working properly, no need for debug display

    return (
        <div style={styles.container} className="art-deco-nav-container">
            {/* Animation counter removed as animation limiting is now working properly */}

            <div
                style={{
                    ...styles.grid,
                    transform: isMobile ? `translate(${gridOffset.x}px, ${gridOffset.y}px)` : 'none',
                    transition: 'transform 0.3s ease-out'
                }}
                className="art-deco-nav-grid"
            >
                {GRID_LAYOUT.map((row, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                        {row.map((tile, colIndex) => (
                            <GridTile
                                key={`${rowIndex}-${colIndex}`}
                                id={tile}
                                isActive={activeTiles.has(tile)}
                                isExpansionSource={Boolean(getExpansionSet(tile).length)}
                                isExpansionTarget={Object.entries(getExpansionSet).some(([_, targets]) =>
                                    targets.includes(tile))}
                                isHighlighted={tile === hoveredTile}
                                isExpanded={tile === expandedTile}
                                onHover={handleHover}
                                onLeave={handleLeave}
                                onTap={handleTap}
                            />
                        ))}
                    </React.Fragment>
                ))}

                {Array.from(activeTiles).map(tileId => (
                    <TileLabel
                        key={`label-${tileId}`}
                        id={tileId}
                        isActive={activeTiles.has(tileId)}
                    />
                ))}

                {renderIdleAnimations()}
                {renderAnimations()}
            </div>
        </div>
    );
};