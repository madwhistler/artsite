import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { styles } from './styles';
import { PAGES } from '../config';
import { useDeviceDetection } from '../hooks/useDeviceDetection';

export const GridTile = ({
                             id,
                             isActive,
                             isExpansionSource,
                             isExpansionTarget,
                             isHighlighted,
                             isExpanded,
                             onHover,
                             onLeave,
                             onTap
                         }) => {
    const navigate = useNavigate();
    const { isMobile } = useDeviceDetection();

    // Debug logging
    useEffect(() => {
        if (id === 'r1') { // Log only for one tile to avoid console spam
            console.log('Device detection state:', { isMobile, id });
        }
    }, [id, isMobile]);

    const tileStyle = {
        ...styles.tile,
        ...(isActive ? styles.activeTile : styles.inactiveTile),
        transform: isExpansionTarget && isHighlighted ? 'scale(0.95)' : 'scale(1)',
    };

    const handleInteraction = useCallback((e) => {
        e.preventDefault();

        if (!isActive) return;

        if (isMobile) {
            // Debug log
            console.log('Mobile interaction:', { id, isExpanded });

            // On mobile, handle tap behavior
            if (isExpanded && PAGES[id]) {
                // If expanded and has a page, navigate
                navigate(PAGES[id].path);
            } else {
                // Otherwise trigger expansion
                onTap(id);
            }
        } else {
            // Debug log
            console.log('Desktop interaction:', { id });

            if (PAGES[id]) {
                // On desktop, direct navigation on click
                navigate(PAGES[id].path);
            }
        }
    }, [id, isActive, isExpanded, isMobile, navigate, onTap]);

    const handleHover = useCallback(() => {
        if (!isMobile) {
            // Debug log
            console.log('Hover event:', { id, isMobile });
            onHover(id);
        }
    }, [id, isMobile, onHover]);

    const handleLeave = useCallback(() => {
        if (!isMobile) {
            onLeave(id);
        }
    }, [id, isMobile, onLeave]);

    return (
        <div
            style={tileStyle}
            onClick={handleInteraction}
            onMouseEnter={handleHover}
            onMouseLeave={handleLeave}
            role="button"
            tabIndex={0}
            data-device-type={isMobile ? 'mobile' : 'desktop'}
        />
    );
};