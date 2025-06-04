import { useRef, useCallback, useEffect } from 'react';
import { ANIMATION_TYPES } from '../config';

// Default maximum number of concurrent animations
const DEFAULT_MAX_ANIMATIONS = 6;

/**
 * Hook to manage animation limits and priorities
 * @param {Map} animations - Current animations map
 * @param {Function} setAnimations - Function to update animations
 * @param {number} maxAnimations - Maximum number of concurrent animations
 * @returns {Object} - Animation management functions
 */
export const useAnimationLimiter = (
    animations,
    setAnimations,
    maxAnimations = DEFAULT_MAX_ANIMATIONS
) => {
    // Keep track of when animations started
    const animationTimestamps = useRef(new Map());

    // Update timestamps when animations change
    useEffect(() => {
        const now = Date.now();

        // Add timestamps for new animations
        animations.forEach((state, sourceId) => {
            if (!animationTimestamps.current.has(sourceId)) {
                animationTimestamps.current.set(sourceId, now);
            }
        });

        // Remove timestamps for animations that are no longer active
        animationTimestamps.current.forEach((_, sourceId) => {
            if (!animations.has(sourceId)) {
                animationTimestamps.current.delete(sourceId);
            }
        });
    }, [animations]);

    /**
     * Get the current number of animations by type
     * @param {string} type - Animation type
     * @returns {number} - Count of animations of the specified type
     */
    const getAnimationCountByType = useCallback((type) => {
        let count = 0;
        animations.forEach((state, sourceId) => {
            // For each animation in the map, check if it has the specified type
            if (state.animationType === type) {
                count++;
            }
        });
        return count;
    }, [animations]);

    /**
     * Get the total number of active animations
     * @returns {number} - Total animation count
     */
    const getTotalAnimationCount = useCallback(() => {
        return animations.size;
    }, [animations]);

    /**
     * Find the oldest animation of a specific type
     * @param {string} type - Animation type to find
     * @returns {string|null} - Source ID of the oldest animation or null if none found
     */
    const findOldestAnimationByType = useCallback((type) => {
        let oldestTime = Infinity;
        let oldestId = null;

        animations.forEach((state, sourceId) => {
            if (state.animationType === type) {
                const timestamp = animationTimestamps.current.get(sourceId) || 0;
                if (timestamp < oldestTime) {
                    oldestTime = timestamp;
                    oldestId = sourceId;
                }
            }
        });

        return oldestId;
    }, [animations]);

    /**
     * Terminate an animation by its source ID
     * @param {string} sourceId - ID of the animation to terminate
     */
    const terminateAnimation = useCallback((sourceId) => {
        if (!sourceId || !animations.has(sourceId)) return;

        setAnimations(prev => {
            const next = new Map(prev);
            next.delete(sourceId);
            return next;
        });

        animationTimestamps.current.delete(sourceId);
    }, [animations, setAnimations]);

    /**
     * Make room for a new animation by terminating lower priority animations if needed
     * @param {string} newAnimationType - Type of the new animation
     * @returns {boolean} - True if room was made or not needed, false if couldn't make room
     */
    const makeRoomForAnimation = useCallback((newAnimationType) => {
        const totalCount = getTotalAnimationCount();

        // If we're under the limit, no need to terminate anything
        if (totalCount < maxAnimations) {
            return true;
        }

        // Determine which animation to terminate based on priority
        let animationToTerminate = null;

        // First try to terminate a BACKGROUND animation
        animationToTerminate = findOldestAnimationByType(ANIMATION_TYPES.BACKGROUND);

        // If no BACKGROUND animation, try to terminate a CONTRACTION animation
        if (!animationToTerminate) {
            animationToTerminate = findOldestAnimationByType(ANIMATION_TYPES.CONTRACTION);
        }

        // If no CONTRACTION animation, try to terminate an EXPANSION animation
        // (only if the new animation is also an EXPANSION - we prioritize existing EXPANSIONS)
        if (!animationToTerminate && newAnimationType === ANIMATION_TYPES.EXPANSION) {
            animationToTerminate = findOldestAnimationByType(ANIMATION_TYPES.EXPANSION);
        }

        // If we found an animation to terminate, do it
        if (animationToTerminate) {
            terminateAnimation(animationToTerminate);
            return true;
        }

        // If we couldn't find an animation to terminate, we can't make room
        return false;
    }, [
        getTotalAnimationCount,
        findOldestAnimationByType,
        terminateAnimation,
        maxAnimations
    ]);

    /**
     * Add a new animation, respecting the maximum limit and priorities
     * @param {string} sourceId - Source ID for the animation
     * @param {Object} state - Animation state
     * @param {string} animationType - Type of animation
     * @returns {boolean} - True if animation was added, false otherwise
     */
    const addAnimation = useCallback((sourceId, state, animationType) => {
        // If this animation is already running, just update its state
        if (animations.has(sourceId)) {
            setAnimations(prev => {
                const next = new Map(prev);
                const existingState = prev.get(sourceId);
                next.set(sourceId, { ...existingState, ...state, animationType });
                return next;
            });
            return true;
        }

        // Check if we need to make room for this animation
        if (getTotalAnimationCount() >= maxAnimations) {
            const madeRoom = makeRoomForAnimation(animationType);
            if (!madeRoom) {
                return false;
            }
        }

        // Add the new animation
        setAnimations(prev => {
            const next = new Map(prev);
            next.set(sourceId, { ...state, animationType });
            return next;
        });

        // Record the timestamp
        animationTimestamps.current.set(sourceId, Date.now());

        return true;
    }, [
        animations,
        setAnimations,
        getTotalAnimationCount,
        makeRoomForAnimation
    ]);

    /**
     * Enforce the animation limit by terminating the oldest animations
     * @param {boolean} respectPriority - Whether to respect animation type priorities
     */
    const enforceLimit = useCallback(() => {
        const totalCount = getTotalAnimationCount();

        if (totalCount <= maxAnimations) return;

        // Try to terminate animations in order of priority (lowest first)
        // 1. Background animations
        // 2. Contraction animations
        // 3. Expansion animations

        // First try to terminate a BACKGROUND animation
        const oldestBackground = findOldestAnimationByType(ANIMATION_TYPES.BACKGROUND);
        if (oldestBackground) {
            terminateAnimation(oldestBackground);
            return;
        }

        // Then try a CONTRACTION animation
        const oldestContraction = findOldestAnimationByType(ANIMATION_TYPES.CONTRACTION);
        if (oldestContraction) {
            terminateAnimation(oldestContraction);
            return;
        }

        // Finally, try an EXPANSION animation
        const oldestExpansion = findOldestAnimationByType(ANIMATION_TYPES.EXPANSION);
        if (oldestExpansion) {
            terminateAnimation(oldestExpansion);
            return;
        }

        // If we get here, try any animation
        // This is a fallback in case we can't find animations of specific types
        animations.forEach((_, sourceId) => {
            if (totalCount > maxAnimations) {
                terminateAnimation(sourceId);
            }
        });
    }, [findOldestAnimationByType, getTotalAnimationCount, maxAnimations, terminateAnimation, animations]);

    // Automatically enforce limits when animations change
    useEffect(() => {
        if (getTotalAnimationCount() > maxAnimations) {
            enforceLimit();
        }
    }, [getTotalAnimationCount, maxAnimations, enforceLimit]);

    return {
        addAnimation,
        terminateAnimation,
        getTotalAnimationCount,
        getAnimationCountByType,
        enforceLimit,
        findOldestAnimationByType
    };
};
