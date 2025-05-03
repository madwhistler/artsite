import React from 'react';
import { styles } from './styles';
import { getTileLabel } from './utils';
import { getTilePosition } from './utils';
import { TILE_SIZE } from '../config';
import { useLabelVisibility } from './LabelVisibilityContext';

export const TileLabel = ({ id, isActive }) => {
    const { labelsVisible } = useLabelVisibility();

    // Don't render if labels are globally disabled or tile is inactive
    if (!labelsVisible || !isActive) return null;

    const [row, col] = getTilePosition(id);
    const labelStyle = {
        ...styles.tileLabel,
        position: 'absolute',
        top: `${row * TILE_SIZE + (TILE_SIZE / 2)}px`,
        left: `${col * TILE_SIZE + (TILE_SIZE / 2)}px`,
        transform: 'translate(-50%, -50%)'
    };

    return (
        <div style={labelStyle}>
            {getTileLabel(id)}
        </div>
    );
};
