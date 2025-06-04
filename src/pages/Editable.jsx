import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { useEditor } from '../components/EditorContext';
import { useFirestoreContent } from '../hooks/useFirestoreContent';
import { EditableImage } from '../components/editable/EditableImage';
import { EditableContent } from '../components/editable/EditableContent';
import { EditableControls } from '../components/editable/EditableControls';
import './Editable.css';

/**
 * Editable component for displaying and editing content from Firestore
 * @param {string} title - The title of the page
 * @param {string} image - Path to the image file
 * @param {string} textFile - Path to the text file
 */
export const Editable = ({ title, image, textFile }) => {
    const { currentUser } = useAuth();
    const { isEditor } = useEditor();
    const [isEditing, setIsEditing] = useState(false);

    // Use our custom hook to handle Firestore content
    const {
        content,
        setContent,
        originalContent,
        imageUrl,
        loading,
        error,
        isUsingEmulator,
        saveStatus,
        isSaving,
        saveContent,
        saveImage
    } = useFirestoreContent(textFile, image);

    // Check if the current user is allowed to edit
    const canEdit = () => {
        if (!currentUser) return false;
        return isEditor;
    };

    // Log authentication status for debugging
    useEffect(() => {
        console.log('Authentication status:', currentUser ? 'Logged in' : 'Not logged in');
        if (currentUser) {
            console.log('User email:', currentUser.email);
            console.log('Can edit:', isEditor);
        }
    }, [currentUser, isEditor]);

    const handleEditToggle = () => {
        if (isEditing) {
            // Cancel editing - revert to original content
            setContent(originalContent);
        }
        setIsEditing(!isEditing);
    };

    const handleContentChange = (e) => {
        setContent(e.target.value);
    };

    const handleSave = async () => {
        if (!currentUser) {
            console.log('No user logged in');
            return;
        }

        if (!canEdit()) {
            console.log('User does not have edit permission');
            return;
        }

        const success = await saveContent(content, currentUser.uid);
        if (success) {
            setIsEditing(false);
        }
    };

    const handleImageUpload = async (file) => {
        if (!currentUser || !canEdit()) {
            console.log('User does not have permission to upload images');
            return;
        }

        await saveImage(file, currentUser.uid);
    };

    if (loading) {
        return <div className="editable-loading">Loading content...</div>;
    }

    if (error) {
        return <div className="editable-error">{error}</div>;
    }

    return (
        <div className="editable-page">
            {isUsingEmulator && (
                <div className="emulator-notice">
                    Using Firebase Emulator
                </div>
            )}

            <div className="editable-header">
                <h1>{title}</h1>

                <div className="editable-controls">
                    {currentUser && !canEdit() && (
                        <div className="permission-message">
                            <em>You don't have permission to edit this content</em>
                        </div>
                    )}
                </div>
            </div>

            <div className="editable-content">
                <EditableImage
                    imageUrl={imageUrl}
                    title={title}
                    originalImagePath={image}
                    canEdit={canEdit()}
                    isEditing={isEditing}
                    onImageUpload={handleImageUpload}
                />
                <EditableContent
                    content={content}
                    isEditing={isEditing}
                    onChange={handleContentChange}
                    onEditToggle={handleEditToggle}
                    onSave={handleSave}
                    isSaving={isSaving}
                    saveStatus={saveStatus}
                    canEdit={canEdit()}
                />
            </div>
        </div>
    );
};