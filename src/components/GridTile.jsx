import React from 'react';
import { styles } from './styles.js';
import { getTileLabel } from './utils.js';
import { INITIAL_ACTIVE_TILES } from '../config';

export const GridTile = ({
                             id,
                             isActive,
                             isExpansionSource,
                             isExpansionTarget,
                             isHighlighted,
                             onHover,
                             onLeave
                         }) => {
    const tileStyle = {
        ...styles.tile,
        ...(isActive ? styles.activeTile : styles.inactiveTile),
        transform: isExpansionTarget && isHighlighted ? 'scale(0.95)' : 'scale(1)',
    };

    const labelStyle = {
        ...styles.tileLabel,
        ...(INITIAL_ACTIVE_TILES.includes(id) ? styles.visibleLabel : {})
    };

    return (
        <div
            style={tileStyle}
            onMouseEnter={() => onHover(id)}
            onMouseLeave={onLeave}
        >
            <span style={labelStyle}>{getTileLabel(id)}</span>
        </div>
    );
};