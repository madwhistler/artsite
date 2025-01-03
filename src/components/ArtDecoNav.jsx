import React, { useState, useEffect } from 'react';

const usePreloadSVGs = () => {
    const [svgContents, setSvgContents] = useState({})

    useEffect(() => {
        const loadSvgs = async () => {
            try {
                const filenames = [
                    '/circles-svg.txt',
                    '/spirals-svg.txt',
                    '/stretchy-svg.txt',
                    '/rectangles-svg.txt'
                ]

                const loadedSvgs = await Promise.all(
                    filenames.map(async (filename, index) => {
                        try {
                            const response = await fetch(filename)
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`)
                            }
                            const text = await response.text()
                            const parser = new DOMParser()
                            const doc = parser.parseFromString(text, 'image/svg+xml')
                            const svgElement = doc.documentElement

                            svgElement.setAttribute('viewBox', '0 0 800 800')
                            svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet')

                            return [index, new XMLSerializer().serializeToString(doc)]
                        } catch (error) {
                            console.error(`Error loading SVG ${filename}:`, error)
                            return [index, null]
                        }
                    })
                )

                setSvgContents(Object.fromEntries(loadedSvgs))
            } catch (error) {
                console.error('Error preloading SVGs:', error)
            }
        }

        loadSvgs()
    }, [])

    return svgContents
}

const QuadrantAnimation = ({ index, svgContent }) => {
    if (!svgContent) return null

    return (
        <div
            className="w-full h-full flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: svgContent }}
        />
    )
}

const BorderDecoration = () => (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
        <path
            className="stroke-amber-700 fill-none"
            strokeWidth="0.5"
            d="M20,0 Q50,10 80,0 L100,0 L100,20 Q90,50 100,80 L100,100 L80,100 Q50,90 20,100 L0,100 L0,80 Q10,50 0,20 L0,0 Z"
        />
        <path
            className="stroke-amber-700 fill-none"
            strokeWidth="0.25"
            d="M25,10 Q50,18 75,10 L90,10 L90,25 Q82,50 90,75 L90,90 L75,90 Q50,82 25,90 L10,90 L10,75 Q18,50 10,25 L10,10 Z"
        />
    </svg>
)

const QuadrantBase = ({ children, index, position, requireInnerHover = true, svgContent }) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const [innerHovered, setInnerHovered] = useState(false)

    const positionClasses = {
        'top-left': 'left-1/2 top-1/2 -translate-x-full -translate-y-full',
        'top-right': 'left-1/2 top-1/2 -translate-y-full',
        'bottom-left': 'left-1/2 top-1/2 -translate-x-full',
        'bottom-right': 'left-1/2 top-1/2'
    }

    return (
        <div className="relative w-full h-full" style={{ zIndex: isExpanded ? 40 : 0 }}>
            <div
                className="w-full h-full"
                onMouseEnter={() => !requireInnerHover && setIsExpanded(true)}
                onMouseLeave={(e) => {
                    const expandedQuadrant = e.currentTarget.querySelector('.expanded-quadrant')
                    if (expandedQuadrant && !expandedQuadrant.contains(e.relatedTarget)) {
                        setIsExpanded(false)
                        setInnerHovered(false)
                    }
                }}
            >
                <div
                    className={`absolute inset-0 flex items-center justify-center border border-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors duration-300 ${
                        isExpanded ? 'opacity-0' : 'opacity-100'
                    }`}
                    onMouseEnter={() => {
                        setInnerHovered(true)
                        setIsExpanded(true)
                    }}
                    onMouseLeave={() => setInnerHovered(false)}
                >
                    <BorderDecoration />
                    <div className="flex-center-all z-10">
                        {children}
                    </div>
                </div>

                {isExpanded && (
                    <div
                        className={`expanded-quadrant fixed w-96 h-96 ${positionClasses[position]} flex items-center justify-center bg-amber-50 transition-all duration-300`}
                        style={{ zIndex: 50 }}
                    >
                        <div className="relative w-full h-full">
                            <div className="absolute inset-0 pointer-events-none">
                                <QuadrantAnimation index={index} svgContent={svgContent} />
                            </div>
                            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export const ArtDecoNav = () => {
    const preloadedSVGs = usePreloadSVGs();
    const [hoveredQuadrant, setHoveredQuadrant] = useState(null);

    const quadrantConfig = [
        {
            id: 'Creation',
            title: 'Creation',
            position: 'top-left',
            animationIndex: 0,
            requireInnerHover: true
        },
        {
            id: 'Giving',
            title: 'Giving',
            position: 'top-right',
            animationIndex: 1,
            requireInnerHover: true
        },
        {
            id: 'Connections',
            title: 'Connections',
            position: 'bottom-left',
            animationIndex: 2,
            requireInnerHover: true
        },
        {
            id: 'Sustaining',
            title: 'Sustaining',
            position: 'bottom-right',
            animationIndex: 3,
            requireInnerHover: true
        }
    ];

    return (
        <div className="fixed inset-0 flex-center bg-slate-50">
            <div className="screen-center w-96 h-96 bg-amber-50 rounded-lg shadow-lg">
                <div className="w-full h-full grid grid-cols-2 grid-rows-2"
                     onMouseLeave={() => setHoveredQuadrant(null)}>
                    {quadrantConfig.map(({ id, title, position, animationIndex, requireInnerHover }) => (
                        <div
                            key={id}
                            onMouseEnter={() => setHoveredQuadrant(id)}
                        >
                            <QuadrantBase
                                position={position}
                                index={animationIndex}
                                requireInnerHover={requireInnerHover}
                                svgContent={preloadedSVGs[animationIndex]}
                                isHovered={hoveredQuadrant === id}
                            >
                                <span className="text-lg font-serif text-emerald-700 text-center">{title}</span>
                            </QuadrantBase>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};