import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, ZoomIn, ZoomOut, X, RotateCw } from 'lucide-react';

/**
 * Component for displaying and zooming images in a modal
 */
export const ImageMagnifier = ({ imageUrl, title, isOpen, onClose }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const imageRef = useRef(null);
    const containerRef = useRef(null);

    // Reset state when modal is opened
    useEffect(() => {
        if (isOpen) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
            setRotation(0);
        }
    }, [isOpen]);

    // Handle zoom in
    const handleZoomIn = () => {
        setScale(prevScale => Math.min(prevScale + 0.5, 5));
    };

    // Handle zoom out
    const handleZoomOut = () => {
        setScale(prevScale => Math.max(prevScale - 0.5, 0.5));
    };

    // Handle rotation
    const handleRotate = () => {
        setRotation(prevRotation => (prevRotation + 90) % 360);
    };

    // Handle mouse wheel for zooming
    const handleWheel = (e) => {
        if (e.deltaY < 0) {
            // Zoom in
            setScale(prevScale => Math.min(prevScale + 0.1, 5));
        } else {
            // Zoom out
            setScale(prevScale => Math.max(prevScale - 0.1, 0.5));
        }
        e.preventDefault();
    };

    // Handle mouse down for dragging
    const handleMouseDown = (e) => {
        if (scale > 1) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    // Handle mouse move for dragging
    const handleMouseMove = (e) => {
        if (isDragging && scale > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    // Handle mouse up to stop dragging
    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Handle touch start for mobile dragging
    const handleTouchStart = (e) => {
        if (scale > 1 && e.touches.length === 1) {
            setIsDragging(true);
            setDragStart({
                x: e.touches[0].clientX - position.x,
                y: e.touches[0].clientY - position.y
            });
        }
    };

    // Handle touch move for mobile dragging
    const handleTouchMove = (e) => {
        if (isDragging && scale > 1 && e.touches.length === 1) {
            setPosition({
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y
            });
            e.preventDefault();
        }
    };

    // Handle touch end to stop mobile dragging
    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    // Handle pinch to zoom on mobile
    const handleTouchPinch = (e) => {
        if (e.touches.length === 2) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );

            // Store the initial distance for pinch zoom
            if (!e.target.dataset.initialPinchDistance) {
                e.target.dataset.initialPinchDistance = distance;
                e.target.dataset.initialScale = scale;
                return;
            }

            const initialDistance = parseFloat(e.target.dataset.initialPinchDistance);
            const initialScale = parseFloat(e.target.dataset.initialScale);
            const scaleFactor = distance / initialDistance;
            const newScale = Math.max(0.5, Math.min(5, initialScale * scaleFactor));

            setScale(newScale);
            e.preventDefault();
        }
    };

    // Clear pinch data when touch ends
    const handleTouchPinchEnd = (e) => {
        if (e.target.dataset.initialPinchDistance) {
            delete e.target.dataset.initialPinchDistance;
            delete e.target.dataset.initialScale;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="image-magnifier-overlay" onClick={onClose}>
            <div
                className="image-magnifier-content"
                onClick={e => e.stopPropagation()}
                ref={containerRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
            >
                <div className="image-magnifier-header">
                    <h3>{title}</h3>
                    <div className="image-magnifier-controls">
                        <button
                            className="image-magnifier-button"
                            onClick={handleZoomIn}
                            title="Zoom In"
                        >
                            <ZoomIn size={20} />
                        </button>
                        <button
                            className="image-magnifier-button"
                            onClick={handleZoomOut}
                            title="Zoom Out"
                        >
                            <ZoomOut size={20} />
                        </button>
                        <button
                            className="image-magnifier-button"
                            onClick={handleRotate}
                            title="Rotate"
                        >
                            <RotateCw size={20} />
                        </button>
                        <button
                            className="image-magnifier-button"
                            onClick={onClose}
                            title="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
                <div
                    className="image-magnifier-container"
                    onTouchStart={handleTouchPinch}
                    onTouchMove={handleTouchPinch}
                    onTouchEnd={handleTouchPinchEnd}
                >
                    <img
                        ref={imageRef}
                        src={imageUrl}
                        alt={title}
                        className="image-magnifier-image"
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                            cursor: isDragging ? 'grabbing' : (scale > 1 ? 'grab' : 'default')
                        }}
                        draggable="false"
                    />
                </div>
                <div className="image-magnifier-footer">
                    <div className="image-magnifier-info">
                        <span>Zoom: {Math.round(scale * 100)}%</span>
                        <span>Rotation: {rotation}°</span>
                    </div>
                    <div className="image-magnifier-hint">
                        <small>Scroll to zoom, drag to pan when zoomed in</small>
                    </div>
                </div>
            </div>
        </div>
    );
};
