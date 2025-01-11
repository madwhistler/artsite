import React from 'react';
import { Player as LottiePlayer } from '@lottiefiles/react-lottie-player';
import { styles } from './styles.js';

export const AnimationContent = ({ type, content, key }) => {
    if (!content) return null;

    const contentStyle = {
        ...styles.animationContent,
    };

    switch (type) {
        case 'svg':
            return (
                <div
                    key={key}
                    style={contentStyle}
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            );
        case 'lottie':
            return (
                <LottiePlayer
                    key={key}
                    style={contentStyle}
                    src={content}
                    loop
                    autoplay
                />
            );
        case 'video':
            return (
                <video
                    key={key}
                    style={contentStyle}
                    autoPlay
                    loop
                    muted
                    playsInline
                >
                    <source src={content} type="video/mp4" />
                </video>
            );
        default:
            return null;
    }
};
