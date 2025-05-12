import React, { useEffect } from 'react';
import { Edit, Save, X } from 'lucide-react';

/**
 * Component for displaying and editing content in the Editable component
 */
export const EditableContent = ({
    content,
    isEditing,
    onChange,
    onEditToggle,
    onSave,
    isSaving,
    saveStatus,
    canEdit,
    sectionId
}) => {
    // Debug logging
    useEffect(() => {
        console.log(`EditableContent (${sectionId}) - content length:`, content?.length);
        console.log(`EditableContent (${sectionId}) - content preview:`, content?.substring(0, 100));

        // Check for unexpected HTML elements
        if (content && content.includes('<title>')) {
            console.error('Found unexpected <title> tag in content!');
            console.log('Full content:', content);
        }

        if (content && content.includes('<div id="root">')) {
            console.error('Found unexpected <div id="root"> in content!');
        }
    }, [content, sectionId]);
    return (
        <div className="editable-text-container">
            {isEditing ? (
                <>
                    <textarea
                        id={`textarea-${sectionId}`}
                        className="editable-textarea"
                        value={content}
                        onChange={onChange}
                    />
                    <div className="editable-text-controls editing">
                        <button
                            className="editable-button editable-save-button"
                            onClick={onSave}
                            disabled={isSaving}
                            title="Save changes"
                        >
                            <Save size={16} />
                            <span>Save</span>
                        </button>
                        <button
                            className="editable-button editable-cancel-button"
                            onClick={onEditToggle}
                            disabled={isSaving}
                            title="Cancel editing"
                        >
                            <X size={16} />
                            <span>Cancel</span>
                        </button>
                        {saveStatus && (
                            <span className="editable-save-status">{saveStatus}</span>
                        )}
                    </div>
                </>
            ) : (
                <>
                    {content ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: content }}
                            className="editable-content-display"
                        />
                    ) : (
                        <div className="editable-content-empty">No content available</div>
                    )}
                    {canEdit && !isEditing && (
                        <div className="editable-text-controls">
                            <button
                                className="editable-button"
                                onClick={onEditToggle}
                                title="Edit content"
                            >
                                <Edit size={16} />
                                <span>Edit</span>
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
