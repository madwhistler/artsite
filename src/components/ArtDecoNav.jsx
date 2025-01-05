import React, { useState, useEffect, useRef } from 'react';
import { Player } from '@lottiefiles/react-lottie-player';

const getFileType = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
        case 'svg':
            return 'svg';
        case 'mp4':
            return 'mp4';
        case 'json':
            return 'lottie';
        default:
            console.warn(`Unsupported file type: ${extension}`);
            return null;
    }
};

const usePreloadAnimations = (files) => {
    const [animationContents, setAnimationContents] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const loadedRef = useRef(false);

    useEffect(() => {
        if (loadedRef.current) return;
        loadedRef.current = true;

        const loadAnimations = async () => {
            setIsLoading(true);
            try {
                const loadedAnimations = await Promise.all(
                    files.map(async (filename, index) => {
                        try {
                            const fileType = getFileType(filename);
                            if (!fileType) return [index, null];

                            const response = await fetch(filename);
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }

                            switch (fileType) {
                                case 'svg': {
                                    const text = await response.text();
                                    const parser = new DOMParser();
                                    const doc = parser.parseFromString(text, 'image/svg+xml');
                                    const svgElement = doc.documentElement;
                                    svgElement.setAttribute('viewBox', '0 0 800 800');
                                    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                                    return [index, {
                                        type: 'svg',
                                        content: new XMLSerializer().serializeToString(doc)
                                    }];
                                }

                                case 'mp4':
                                    return [index, {
                                        type: 'mp4',
                                        content: filename
                                    }];

                                case 'lottie': {
                                    try {
                                        const json = await response.json();
                                        if (!json.v || typeof json.ip === 'undefined' || typeof json.op === 'undefined') {
                                            console.warn('Potentially invalid Lottie JSON structure:', json);
                                            return [index, null];
                                        }
                                        return [index, {
                                            type: 'lottie',
                                            content: json
                                        }];
                                    } catch (error) {
                                        console.error('Error parsing Lottie JSON:', error);
                                        return [index, null];
                                    }
                                }

                                default:
                                    return [index, null];
                            }
                        } catch (error) {
                            console.error(`Error loading animation ${filename}:`, error);
                            return [index, null];
                        }
                    })
                );

                setAnimationContents(Object.fromEntries(loadedAnimations));
            } catch (error) {
                console.error('Error loading animations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadAnimations();
    }, [files]);

    return animationContents;
};

const QuadrantAnimation = ({ animation }) => {
    if (!animation) return null;

    const containerStyle = {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    switch (animation.type) {
        case 'svg':
            return (
                <div
                    style={containerStyle}
                    dangerouslySetInnerHTML={{ __html: animation.content }}
                />
            );

        case 'mp4':
            return (
                <div style={containerStyle}>
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    >
                        <source src={animation.content} type="video/mp4" />
                    </video>
                </div>
            );

        case 'lottie':
            if (!animation.content) {
                console.error('Lottie animation content is missing');
                return null;
            }
            return (
                <div style={containerStyle}>
                    <Player
                        autoplay
                        loop
                        src={animation.content}
                        style={{ height: '100%', width: '100%' }}
                    />
                </div>
            );

        default:
            return null;
    }
};

const QuadrantBase = ({ children, position, animation }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="quadrant-wrapper" style={{ zIndex: isExpanded ? 40 : 0 }}>
            <div onMouseLeave={() => setIsExpanded(false)}>
                <div
                    className="quadrant-base"
                    onMouseEnter={() => setIsExpanded(true)}
                >
                    {children}
                </div>

                {isExpanded && (
                    <div
                        className={`expanded-quadrant quadrant-position-${position}`}
                        style={{ zIndex: 50 }}
                        ref={el => {
                            if (el) {
                                const rect = el.getBoundingClientRect();
                                console.log(`${position} expanded quadrant:`, {
                                    left: rect.left,
                                    top: rect.top,
                                    right: rect.right,
                                    bottom: rect.bottom
                                });
                            }
                        }}
                    >
                        <div className="animation-container">
                            <div className="animation-wrapper">
                                <QuadrantAnimation animation={animation} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const ArtDecoNav = () => {
    const quadrantConfig = [
        {
            id: 'Creation',
            title: 'Creation',
            position: 'top-left',
            animationFile: '/circles.svg'
        },
        {
            id: 'Giving',
            title: 'Giving',
            position: 'top-right',
            animationFile: '/vines.mp4'
        },
        {
            id: 'Connections',
            title: 'Connections',
            position: 'bottom-left',
            animationFile: '/rectangles.svg'
        },
        {
            id: 'Sustaining',
            title: 'Sustaining',
            position: 'bottom-right',
            animationFile: '/infinity-loop.json'
        }
    ];

    const animationFiles = quadrantConfig.map(config => config.animationFile);
    const preloadedAnimations = usePreloadAnimations(animationFiles);
    const [hoveredQuadrant, setHoveredQuadrant] = useState(null);

    return (
        <div className="nav-container">
            <div className="nav-grid">
                <div
                    className="nav-grid-inner"
                    onMouseLeave={() => setHoveredQuadrant(null)}
                >
                    {quadrantConfig.map((config, index) => (
                        <div
                            key={config.id}
                            onMouseEnter={() => setHoveredQuadrant(config.id)}
                        >
                            <QuadrantBase
                                position={config.position}
                                animation={preloadedAnimations[index]}
                                isHovered={hoveredQuadrant === config.id}
                            >
                                <span className="quadrant-title">{config.title}</span>
                            </QuadrantBase>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};