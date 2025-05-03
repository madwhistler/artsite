import React, { useState, useEffect, useRef } from 'react';
import { AnimationContent } from './AnimationContent';
import { styles } from './styles';
import { ANIMATION_TYPES } from './AnimationTypes';
import { TILE_SIZE } from '../config';
import { getExpansionOrigin, getTilePosition } from './utils';

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

export const AnimationOverlay = ({ animationData, sourceId, isVisible, type, onAnimationEnd }) => {
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
        return () => { loadingRef.current = false; };
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