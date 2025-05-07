import React from 'react';
import { EditableImage } from './EditableImage';
import { EditableContent } from './EditableContent';

/**
 * Component for a single editable section with image and text content
 * Supports different image alignments (left/right)
 */
export const EditableSection = ({
    content,
    imageUrl,
    originalImagePath,
    align = 'left',
    isEditing,
    onChange,
    onEditToggle,
    onSave,
    onImageUpload,
    isSaving,
    saveStatus,
    canEdit,
    sectionId
}) => {
    const handleContentChange = (e) => {
        // Pass the section ID and new content to the parent component
        onChange(sectionId, e.target.value);
    };

    const handleImageUpload = (file) => {
        onImageUpload(sectionId, file);
    };

    return (
        <div className={`editable-section align-${align}`}>
            <EditableImage
                imageUrl={imageUrl}
                title={`Section ${sectionId}`}
                originalImagePath={originalImagePath}
                canEdit={canEdit}
                isEditing={isEditing}
                onImageUpload={handleImageUpload}
                align={align}
            />
            <EditableContent
                content={content}
                isEditing={isEditing}
                onChange={handleContentChange}
                onEditToggle={() => onEditToggle(sectionId)}
                onSave={() => onSave(sectionId)}
                isSaving={isSaving}
                saveStatus={saveStatus}
                canEdit={canEdit}
                sectionId={sectionId}
            />
        </div>
    );
};
