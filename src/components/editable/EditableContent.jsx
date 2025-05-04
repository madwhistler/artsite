import React from 'react';

/**
 * Component for displaying and editing content in the Editable component
 */
export const EditableContent = ({ 
    content, 
    isEditing, 
    onChange 
}) => {
    return (
        <div className="editable-text-container">
            {isEditing ? (
                <textarea
                    className="editable-textarea"
                    value={content}
                    onChange={onChange}
                />
            ) : (
                <div dangerouslySetInnerHTML={{ __html: content }} />
            )}
        </div>
    );
};
