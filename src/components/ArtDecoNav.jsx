import React, { useState, useEffect } from 'react';
import { styles } from './styles';
import { getAnimationType, getExpansionOrigin, calculateActiveTiles } from './utils';
import { GridTile } from './GridTile';
import { AnimationContent } from './AnimationContent';
import {
    INITIAL_ACTIVE_TILES,
    GRID_LAYOUT,
    EXPANSION_SETS,
    ANIMATION_FILES,
    TILE_SIZE
} from '../config';

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

    if (!isVisible || !animationData) return null;

    const [row, col] = getExpansionOrigin(sourceId);
    const overlayStyle = {
        ...styles.animationOverlay,
        top: `${row * TILE_SIZE}px`,
        left: `${col * TILE_SIZE}px`,
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

    const handleHover = (tileId) => {
        if (EXPANSION_SETS[tileId]) {
            // Handle hover on expansion source
            const expansionTargets = EXPANSION_SETS[tileId];
            const newHoveredSet = new Set([tileId, ...expansionTargets]);
            setHoveredSet(newHoveredSet);
            setActiveSource(tileId);
            setActiveTiles(calculateActiveTiles(newHoveredSet));
        } else {
            // Handle hover on expansion target
            const sourceId = Object.entries(EXPANSION_SETS)
                .find(([_, targets]) => targets.includes(tileId))?.[0];

            if (sourceId) {
                const expansionTargets = EXPANSION_SETS[sourceId];
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
                                isHighlighted={hoveredSet.has(tile)}
                                onHover={handleHover}
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
                    />
                )}
            </div>
        </div>
    );
};