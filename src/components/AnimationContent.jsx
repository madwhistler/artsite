import React from 'react';
import { Player as LottiePlayer } from '@lottiefiles/react-lottie-player';
import { styles } from './styles.js';

export const AnimationContent = ({ type, content, animationType, loop = true, onEnded }) => {
    if (!content) return null;

    const contentStyle = {
        ...styles.animationContent,
    };

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
                >
                    <source src={content} type="video/mp4" />
                </video>
            );
        default:
            return null;
    }
};