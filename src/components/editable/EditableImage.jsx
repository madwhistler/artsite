import React, { useRef, useState } from 'react';
import { Upload, Maximize2 } from 'lucide-react';
import { ImageMagnifier } from './ImageMagnifier';

/**
 * Component for displaying and uploading images in the Editable component
 */
export const EditableImage = ({
    imageUrl,
    title,
    originalImagePath,
    canEdit,
    isEditing,
    onImageUpload,
    align = 'left'
}) => {
    const fileInputRef = useRef(null);
    const [magnifierOpen, setMagnifierOpen] = useState(false);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            onImageUpload(file);
        }
    };

    const toggleMagnifier = () => {
        setMagnifierOpen(!magnifierOpen);
    };

    return (
        <div className={`editable-image-container align-${align}`}>
            {imageUrl ? (
                <>
                    <div className="editable-image-wrapper">
                        <img
                            src={imageUrl.startsWith('data:') ? imageUrl : `${imageUrl}?t=${Date.now()}`}
                            alt={title}
                            className="editable-image"
                            key={`img-${Date.now()}`}
                            onError={(e) => {
                                console.error('Error loading image:', e);
                                e.target.onerror = null;
                                e.target.src = originalImagePath; // Fallback to original image path
                            }}
                        />
                        <button
                            className="editable-image-magnify"
                            onClick={toggleMagnifier}
                            title="Magnify Image"
                        >
                            <Maximize2 size={18} />
                        </button>
                    </div>

                    {/* Image Magnifier Modal */}
                    <ImageMagnifier
                        imageUrl={imageUrl.startsWith('data:') ? imageUrl : `${imageUrl}?t=${Date.now()}`}
                        title={title}
                        isOpen={magnifierOpen}
                        onClose={() => setMagnifierOpen(false)}
                    />
                </>
            ) : (
                <div className="editable-image-placeholder">
                    No image available
                </div>
            )}

            {canEdit && !isEditing && (
                <>
                    <input
                        type="file"
                        id="image-upload"
                        className="editable-file-input"
                        accept="image/*"
                        onChange={handleImageUpload}
                        ref={fileInputRef}
                    />
                    <label htmlFor="image-upload" className="editable-file-label">
                        <Upload size={16} />
                        <span>Upload Image</span>
                    </label>
                </>
            )}
        </div>
    );
};
