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
} from '../config';
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
    }, [animations, activeTiles, handleContractionEnd, animationKeyRef]);

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
    }, [activeTiles, animations, animationKeyRef]);

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