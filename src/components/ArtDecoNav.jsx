import React, { useCallback, useState } from 'react';
import { GridTile } from './GridTile';
import { AnimationOverlay } from './AnimationOverlay';
import { TileLabel } from './TileLabel';
import { styles } from './styles';
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

    const handleLeave = useCallback((tileId) => {
        if (!isMobile) {
            setHoveredTile(null);
        }
    }, [setHoveredTile, isMobile]);

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
    }, [expandedTile, contractQuadrant, updateActiveStates]);

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

    // Get current animation counts for debug display
    const animationCount = animationLimiter.getTotalAnimationCount();
    const isOverLimit = animationCount > MAX_CONCURRENT_ANIMATIONS;

    return (
        <div style={styles.container}>
            {/* Debug display for animation counts */}
            <div style={{
                position: 'fixed',
                bottom: '20px',
                right: '10px',
                backgroundColor: isOverLimit ? 'rgba(255, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace',
                zIndex: 1000,
                pointerEvents: 'auto'
            }}>
                Animations: {animationCount}/{MAX_CONCURRENT_ANIMATIONS}
                <button
                    onClick={() => animationLimiter.enforceLimit()}
                    style={{
                        marginLeft: '5px',
                        background: 'none',
                        border: '1px solid white',
                        color: 'white',
                        padding: '2px 5px',
                        fontSize: '10px',
                        cursor: 'pointer',
                        borderRadius: '3px'
                    }}
                >
                    Enforce
                </button>
            </div>

            <div style={styles.grid}>
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
                                onHover={updateActiveStates}
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