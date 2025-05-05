import React, { useState, useRef } from 'react';
export const useNavigationState = (initialActiveTiles) => {
    const [hoveredTile, setHoveredTile] = useState(null);
    const [activeTiles, setActiveTiles] = useState(new Set(initialActiveTiles));
    const [expandableTiles, setExpandableTiles] = useState(new Set(initialActiveTiles));
    const [animations, setAnimations] = useState(new Map());
    const animationKeyRef = useRef(0);
    const activeExpansionRef = useRef(null);

    return {
        hoveredTile,
        setHoveredTile,
        activeTiles,
        setActiveTiles,
        expandableTiles,
        setExpandableTiles,
        animations,
        setAnimations,
        animationKeyRef,
        activeExpansionRef,
        // The animation limiter will be added by the ArtDecoNav component
        animationLimiter: null
    };
};