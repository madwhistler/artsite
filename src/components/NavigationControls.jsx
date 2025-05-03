import { useCallback } from 'react';
import { INITIAL_ACTIVE_TILES, EXPANSION_SETS } from '../config';

const getExpansionSet = (tileId) => {
    return EXPANSION_SETS[tileId] || [];
};

const getQuadrant = (tileId) => {
    return tileId ? tileId.charAt(0) : '';
};

// Helper to ensure core tiles remain in active set
const ensureCoreTiles = (tiles) => {
    const newSet = new Set(tiles);
    INITIAL_ACTIVE_TILES.forEach(coreTile => newSet.add(coreTile));
    return newSet;
};

export const useNavigationControls = (navigationState) => {
    const {
        setAnimations,
        setActiveTiles,
        setExpandableTiles,
        activeExpansionRef,
        setHoveredTile,
        animations,
        activeTiles,
        animationKeyRef
    } = navigationState;

    // Reset active tiles to initial state
    const resetToCore = useCallback(() => {
        setActiveTiles(new Set(INITIAL_ACTIVE_TILES));
        setExpandableTiles(new Set(INITIAL_ACTIVE_TILES));
    }, [setActiveTiles, setExpandableTiles]);

    // Contract all expansions in a quadrant
    const contractQuadrant = useCallback((quadrantTileId) => {
        if (!quadrantTileId) return;

        const quadrant = getQuadrant(quadrantTileId);

        // Contract all expanding tiles in this quadrant
        setAnimations(prev => {
            const next = new Map(prev);
            prev.forEach((state, tileId) => {
                if (getQuadrant(tileId) === quadrant && state.expanding) {
                    next.set(tileId, { expanding: false, contracting: true });
                }
            });
            return next;
        });

        // Remove expansion targets from active set for all tiles in this quadrant
        // while preserving core tiles
        setActiveTiles(prev => {
            const next = new Set(prev);
            Object.entries(EXPANSION_SETS).forEach(([sourceId, targets]) => {
                if (getQuadrant(sourceId) === quadrant) {
                    targets.forEach(target => {
                        if (!INITIAL_ACTIVE_TILES.includes(target)) {
                            next.delete(target);
                        }
                    });
                }
            });
            return ensureCoreTiles(next);
        });

        if (getQuadrant(activeExpansionRef.current) === quadrant) {
            activeExpansionRef.current = null;
        }
    }, [setAnimations, setActiveTiles, activeExpansionRef]);

    // Handle animation completion
    const handleContractionEnd = useCallback((sourceId) => {
        setAnimations(prev => {
            const next = new Map(prev);
            next.delete(sourceId);
            return next;
        });
    }, [setAnimations]);

    // Handle tile state updates on hover/tap
    const updateActiveStates = useCallback((tileId) => {
        if (!tileId) return;

        const newQuadrant = getQuadrant(tileId);
        const currentExpansionTile = activeExpansionRef.current;
        const currentQuadrant = currentExpansionTile ? getQuadrant(currentExpansionTile) : null;

        // If entering a non-active tile, reset to core and contract all expansions
        if (!activeTiles.has(tileId)) {
            resetToCore();
            if (currentExpansionTile) {
                contractQuadrant(currentExpansionTile);
            }
            setHoveredTile(tileId);
            return;
        }

        // If crossing quadrant boundaries, contract the current quadrant
        if (currentQuadrant && newQuadrant !== currentQuadrant) {
            contractQuadrant(currentExpansionTile);
        }

        // Handle expansion for active tiles that have expansion sets
        if (EXPANSION_SETS[tileId]) {
            setAnimations(prev => {
                const next = new Map(prev);
                next.set(tileId, { expanding: true, contracting: false });
                return next;
            });

            // Add expansion targets to active tiles while preserving core tiles
            setActiveTiles(prev => {
                const next = new Set(prev);
                getExpansionSet(tileId).forEach(target => next.add(target));
                return ensureCoreTiles(next);
            });

            activeExpansionRef.current = tileId;
            animationKeyRef.current += 1;
        }

        setHoveredTile(tileId);
    }, [
        contractQuadrant,
        resetToCore,
        setActiveTiles,
        setHoveredTile,
        setAnimations,
        activeExpansionRef,
        activeTiles,
        animationKeyRef
    ]);

    return {
        handleContractionEnd,
        contractQuadrant,
        updateActiveStates,
        getExpansionSet
    };
};