import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { styles } from './styles';
import { PAGES, EXPANSION_SETS } from '../config';
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

    const tileStyle = {
        ...styles.tile,
        ...(isActive ? styles.activeTile : styles.inactiveTile),
        transform: isExpansionTarget && isHighlighted ? 'scale(0.95)' : 'scale(1)',
    };

    const handleInteraction = useCallback((e) => {
        e.preventDefault();

        if (!isActive) return;

        if (isMobile) {
            // On mobile, handle tap behavior
            if (isExpanded && PAGES[id]) {
                // If expanded and has a page, navigate
                navigate(PAGES[id].path);
            } else if (EXPANSION_SETS[id]) {
                // If tile has expansion set, trigger expansion
                onTap(id);
            } else if (PAGES[id]) {
                // If tile has no expansion set but has a page, navigate directly
                navigate(PAGES[id].path);
            }
            // If tile has neither expansion set nor page, do nothing
        } else {
             if (PAGES[id]) {
                // On desktop, direct navigation on click
                navigate(PAGES[id].path);
            }
        }
    }, [id, isActive, isExpanded, isMobile, navigate, onTap]);

    const handleHover = useCallback(() => {
        if (!isMobile) {
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