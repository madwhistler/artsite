import React from 'react';
import { useLabelVisibility } from './LabelVisibilityContext';
import { Eye, EyeOff } from 'lucide-react';

export const LabelToggle = () => {
    const { labelsVisible, setLabelsVisible } = useLabelVisibility();

    const toggleStyles = {
        position: 'fixed',
        top: '10px',
        left: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '4px',
        padding: '8px',
        cursor: 'pointer',
        color: '#E5E5E5',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
    };

    return (
        <button
            style={toggleStyles}
            onClick={() => setLabelsVisible(!labelsVisible)}
            title={labelsVisible ? "Hide Labels" : "Show Labels"}
        >
            {labelsVisible ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
    );
};