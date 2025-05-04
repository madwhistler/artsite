import React from 'react';
import { Edit, Save, X } from 'lucide-react';

/**
 * Component for displaying edit controls in the Editable component
 */
export const EditableControls = ({ 
    isEditing, 
    onEditToggle, 
    onSave, 
    isSaving, 
    saveStatus 
}) => {
    return (
        <div className="editable-controls">
            {isEditing ? (
                <>
                    <button
                        className="editable-button editable-save-button"
                        onClick={onSave}
                        disabled={isSaving}
                    >
                        <Save size={16} />
                        <span>Save</span>
                    </button>
                    <button
                        className="editable-button editable-cancel-button"
                        onClick={onEditToggle}
                        disabled={isSaving}
                    >
                        <X size={16} />
                        <span>Cancel</span>
                    </button>
                    {saveStatus && (
                        <span className="editable-save-status">{saveStatus}</span>
                    )}
                </>
            ) : (
                <button
                    className="editable-button"
                    onClick={onEditToggle}
                >
                    <Edit size={16} />
                    <span>Edit</span>
                </button>
            )}
        </div>
    );
};
