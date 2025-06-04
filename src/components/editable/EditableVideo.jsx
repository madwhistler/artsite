import React, { useRef, useState } from 'react';
import { Upload, Edit, Save, X, Video, Code } from 'lucide-react';

/**
 * Component for displaying and editing video content
 */
export const EditableVideo = ({
    videoUrl,
    embedCode,
    title,
    canEdit,
    isEditing,
    onVideoUpload,
    onEmbedCodeSave,
    onEditToggle,
    isSaving,
    saveStatus
}) => {
    const fileInputRef = useRef(null);
    const [editingEmbedCode, setEditingEmbedCode] = useState(embedCode || '');
    const [activeTab, setActiveTab] = useState(embedCode ? 'embed' : 'video');

    const handleVideoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check if it's a video file
            if (file.type.startsWith('video/')) {
                onVideoUpload(file);
            } else {
                alert('Please select a valid video file (mp4, mov, etc.)');
            }
        }
    };

    const handleEmbedCodeSave = () => {
        onEmbedCodeSave(editingEmbedCode);
    };

    const handleEmbedCodeCancel = () => {
        setEditingEmbedCode(embedCode || '');
        onEditToggle();
    };

    // Render video player for local/uploaded videos
    const renderVideoPlayer = () => {
        if (!videoUrl) return null;

        return (
            <div className="video-container">
                <video
                    className="video-player"
                    controls
                    preload="metadata"
                >
                    <source src={videoUrl} type="video/mp4" />
                    <source src={videoUrl} type="video/mov" />
                    Your browser does not support the video tag.
                </video>
            </div>
        );
    };

    // Render embedded video (YouTube, etc.)
    const renderEmbeddedVideo = () => {
        if (!embedCode) return null;

        // Create a responsive wrapper for the embed
        return (
            <div className="video-container">
                <div className="video-embed-wrapper">
                    <div
                        className="video-embed-content"
                        dangerouslySetInnerHTML={{ __html: embedCode }}
                    />
                </div>
            </div>
        );
    };

    // Render video upload section for editors
    const renderVideoUpload = () => {
        if (!canEdit || !isEditing) return null;

        return (
            <div className="video-upload-section">
                <h3>Upload Video File</h3>
                <p>Select an MP4 or MOV video file to upload</p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/mov,video/*"
                    onChange={handleVideoUpload}
                    style={{ display: 'none' }}
                />
                <button
                    className="video-upload-button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSaving}
                >
                    <Upload size={16} />
                    <span>Choose Video File</span>
                </button>
            </div>
        );
    };

    // Render embed code editor for editors
    const renderEmbedCodeEditor = () => {
        if (!canEdit) return null;

        if (isEditing) {
            return (
                <div className="embed-code-section">
                    <h3>Embed Code</h3>
                    <p>Paste embed code from YouTube, Vimeo, or other video platforms</p>
                    <textarea
                        className="embed-code-textarea"
                        value={editingEmbedCode}
                        onChange={(e) => setEditingEmbedCode(e.target.value)}
                        placeholder="Paste your embed code here..."
                    />
                    <div className="video-edit-controls">
                        <button
                            className="video-upload-button"
                            onClick={handleEmbedCodeSave}
                            disabled={isSaving}
                        >
                            <Save size={16} />
                            <span>Save Embed Code</span>
                        </button>
                        <button
                            className="video-upload-button"
                            onClick={handleEmbedCodeCancel}
                            disabled={isSaving}
                            style={{ background: '#666' }}
                        >
                            <X size={16} />
                            <span>Cancel</span>
                        </button>
                    </div>
                </div>
            );
        }

        return null;
    };

    // Render tab selector for editing mode
    const renderTabSelector = () => {
        if (!canEdit || !isEditing) return null;

        return (
            <div className="video-tab-selector">
                <button
                    className={`video-tab ${activeTab === 'video' ? 'active' : ''}`}
                    onClick={() => setActiveTab('video')}
                >
                    <Video size={16} />
                    <span>Upload Video</span>
                </button>
                <button
                    className={`video-tab ${activeTab === 'embed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('embed')}
                >
                    <Code size={16} />
                    <span>Embed Code</span>
                </button>
            </div>
        );
    };

    return (
        <div className="editable-video-container">
            {/* Display current video content */}
            {!isEditing && (
                <>
                    {embedCode ? renderEmbeddedVideo() : renderVideoPlayer()}

                    {/* Edit button for editors */}
                    {canEdit && (
                        <div className="video-controls">
                            <button
                                className="video-upload-button"
                                onClick={onEditToggle}
                                title="Edit video"
                            >
                                <Edit size={16} />
                                <span>Edit Video</span>
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Editing interface */}
            {isEditing && (
                <>
                    {renderTabSelector()}

                    {activeTab === 'video' && renderVideoUpload()}
                    {activeTab === 'embed' && renderEmbedCodeEditor()}

                    {saveStatus && (
                        <div className="video-save-status">{saveStatus}</div>
                    )}
                </>
            )}

            {/* Show placeholder if no content */}
            {!isEditing && !videoUrl && !embedCode && (
                <div className="video-placeholder">
                    <Video size={48} />
                    <p>No video content available</p>
                    {canEdit && (
                        <button
                            className="video-upload-button"
                            onClick={onEditToggle}
                        >
                            <Edit size={16} />
                            <span>Add Video</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
