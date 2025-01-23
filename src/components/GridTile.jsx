import React from 'react';
import { useNavigate } from 'react-router-dom';
import { styles } from './styles.js';
import { getTileLabel } from './utils.js';
import { PAGES, CORE_TILES } from '../config';

export const GridTile = ({
                             id,
                             isActive,
                             isExpansionSource,
                             isExpansionTarget,
                             isHighlighted,
                             onHover,
                             onLeave
                         }) => {
    const navigate = useNavigate();
    const pageConfig = PAGES[id];

    const handleClick = () => {
        if (isActive && pageConfig?.path) {
            navigate(pageConfig.path);
        }
    };

    const tileStyle = {
        ...styles.tile,
        ...(isActive ? styles.activeTile : styles.inactiveTile),
        transform: isExpansionTarget && isHighlighted ? 'scale(0.95)' : 'scale(1)',
        cursor: isActive && pageConfig?.path ? 'pointer' : undefined
    };

    const labelStyle = {
        ...styles.tileLabel,
        ...(CORE_TILES.includes(id) ? styles.visibleLabel : {})
    };

    return (
        <div
            style={tileStyle}
            onClick={handleClick}
            onMouseEnter={() => onHover(id)}
            onMouseLeave={onLeave}
        >
            <span style={labelStyle}>{getTileLabel(id)}</span>
        </div>
    );
};