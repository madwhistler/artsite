import React from 'react';
import { Player as LottiePlayer } from '@lottiefiles/react-lottie-player';
import { styles } from './styles.js';

export const AnimationContent = ({ type, content, animationType, loop = true, onEnded, preserveAspectRatio, animationSrc }) => {
    if (!content) return null;

    const contentStyle = {
        ...styles.animationContent,
    };

    // Special handling for videos that need to preserve aspect ratio
    if (preserveAspectRatio && type === 'video') {
        contentStyle.objectFit = 'contain';
        contentStyle.width = 'auto';
        contentStyle.height = 'auto';
        contentStyle.maxWidth = '100%';
        contentStyle.maxHeight = '100%';
    }

    // For background animations, ensure they have proper transparency
    if (animationType === 'BACKGROUND') {
        contentStyle.opacity = 0.8; // Slight transparency
        contentStyle.mixBlendMode = 'screen'; // Blend with background
    }

    switch (type) {
        case 'svg':
            return (
                <div
                    style={contentStyle}
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            );
        case 'lottie':
            return (
                <LottiePlayer
                    style={contentStyle}
                    src={content}
                    loop={loop}
                    autoplay
                    onComplete={!loop ? onEnded : undefined}
                />
            );
        case 'video':
            return (
                <video
                    style={contentStyle}
                    autoPlay
                    loop={loop}
                    muted
                    playsInline
                    onEnded={!loop ? onEnded : undefined}
                    className={`${preserveAspectRatio ? 'preserve-aspect-ratio' : ''} ${animationType === 'BACKGROUND' ? 'background-video' : ''}`}
                >
                    <source src={content} type="video/mp4" />
                </video>
            );
        default:
            return null;
    }
};