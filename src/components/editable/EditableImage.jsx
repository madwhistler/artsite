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
                                // Prevent infinite loop by checking if we're already using the original path
                                if (e.target.src.indexOf(originalImagePath) === -1) {
                                    console.log('Falling back to original image path:', originalImagePath);
                                    e.target.onerror = null; // Prevent further error handling
                                    e.target.src = originalImagePath; // Fallback to original image path
                                } else {
                                    console.error('Both imageUrl and originalImagePath failed to load');
                                    e.target.onerror = null; // Prevent further error handling
                                    // Use a placeholder image instead
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
                                }
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
