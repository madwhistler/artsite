import React, { useState, useEffect, useRef } from 'react';
import { AnimationContent } from './AnimationContent';
import { styles } from './styles';
import { ANIMATION_TYPES } from './AnimationTypes';
import { TILE_SIZE } from '../config';
import { getExpansionOrigin, getTilePosition } from './utils';
import './animations.css';

const getAnimationStyle = (type, sourceId, animationData) => {
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
        case ANIMATION_TYPES.BACKGROUND: {
            // Get scale and position from animationData or use defaults
            const scale = animationData?.scale || 1.0;
            const position = animationData?.position || 'center';

            // Special handling for Lavanic_Border.mp4 which is 1088x138
            const isLavanicBorder = animationData?.src?.includes('Lavanic_Border.mp4');

            // Create position-specific styles
            let positionStyle = {};

            if (isLavanicBorder) {
                // For Lavanic_Border, we want to preserve its aspect ratio and not crop it
                switch (position) {
                    case 'top':
                        positionStyle = {
                            top: '20px',
                            left: '50%',
                            transform: `translateX(-50%) scale(${scale})`,
                            width: 'auto',
                            height: 'auto',
                            maxWidth: '100%'
                        };
                        break;
                    case 'bottom':
                        positionStyle = {
                            bottom: '20px',
                            left: '50%',
                            transform: `translateX(-50%) scale(${scale})`,
                            width: 'auto',
                            height: 'auto',
                            maxWidth: '100%'
                        };
                        break;
                    case 'left':
                        positionStyle = {
                            left: '20px',
                            top: '50%',
                            transform: `translateY(-50%) scale(${scale})`,
                            width: 'auto',
                            height: 'auto',
                            maxHeight: '100%'
                        };
                        break;
                    case 'right':
                        positionStyle = {
                            right: '20px',
                            top: '50%',
                            transform: `translateY(-50%) scale(${scale})`,
                            width: 'auto',
                            height: 'auto',
                            maxHeight: '100%'
                        };
                        break;
                    case 'center':
                    default:
                        positionStyle = {
                            top: '50%',
                            left: '50%',
                            transform: `translate(-50%, -50%) scale(${scale})`,
                            width: 'auto',
                            height: 'auto',
                            maxWidth: '100%',
                            maxHeight: '100%'
                        };
                        break;
                }
            } else {
                // For other animations, use the standard positioning
                switch (position) {
                    case 'top':
                        positionStyle = { top: '0', left: '50%', transform: `translateX(-50%) scale(${scale})` };
                        break;
                    case 'bottom':
                        positionStyle = { bottom: '0', left: '50%', transform: `translateX(-50%) scale(${scale})` };
                        break;
                    case 'left':
                        positionStyle = { left: '0', top: '50%', transform: `translateY(-50%) scale(${scale})` };
                        break;
                    case 'right':
                        positionStyle = { right: '0', top: '50%', transform: `translateY(-50%) scale(${scale})` };
                        break;
                    case 'center':
                    default:
                        positionStyle = { top: '50%', left: '50%', transform: `translate(-50%, -50%) scale(${scale})` };
                        break;
                }
            }

            return {
                ...baseStyle,
                ...styles.backgroundAnimation,
                ...positionStyle,
                preserveAspectRatio: isLavanicBorder
            };
        }
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

    const overlayStyle = getAnimationStyle(type, sourceId, animationData);

    // Determine position class based on animationData
    let positionClass = '';
    if (type === ANIMATION_TYPES.BACKGROUND) {
        const position = animationData?.position || 'center';
        positionClass = `animation-position-${position}`;
    }

    return (
        <div
            style={overlayStyle}
            className={positionClass}
            data-animation-type={type}
            data-animation-position={animationData?.position || 'center'}
            data-animation-scale={animationData?.scale || '1.0'}
        >
            <AnimationContent
                {...content}
                animationType={type}
                loop={type === ANIMATION_TYPES.TILE || type === ANIMATION_TYPES.BACKGROUND}
                onEnded={type === ANIMATION_TYPES.CONTRACTION ? onAnimationEnd : undefined}
                preserveAspectRatio={overlayStyle.preserveAspectRatio}
                animationSrc={animationData?.src}
            />
        </div>
    );
};