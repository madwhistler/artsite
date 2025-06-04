import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../components/AuthContext';
import { useEditor } from '../components/EditorContext';
import { useFirestoreVideo } from '../hooks/useFirestoreVideo';
import { EditableVideo } from '../components/editable/EditableVideo';
import { pageVariants } from '../animations/animationVariants';
import { NavigationContext } from '../components/NavigationContext';
import './Editable.css';
import './VideoPage.css';

/**
 * VideoPage component for displaying and editing video content
 * Supports both local video files and embed codes (YouTube, etc.)
 * @param {string} title - The title of the page
 * @param {string} video - Path to the video file or embed code
 * @param {string} embedCode - Optional embed code for external videos
 */
export const VideoPage = ({ title, video, embedCode }) => {
    const { currentUser } = useAuth();
    const { isEditor } = useEditor();
    const [isEditing, setIsEditing] = useState(false);
    const { isBackNavigation } = React.useContext(NavigationContext);

    // Use our custom hook to handle Firestore video content
    const {
        videoUrl,
        embedCode: firestoreEmbedCode,
        loading,
        error,
        isUsingEmulator,
        saveStatus,
        isSaving,
        saveVideo,
        saveEmbedCode
    } = useFirestoreVideo(video, embedCode);

    // Check if the current user is allowed to edit
    const canEdit = () => {
        if (!currentUser) return false;
        return isEditor;
    };

    const handleVideoUpload = async (file) => {
        if (!currentUser || !canEdit()) {
            console.log('User does not have permission to upload videos');
            return;
        }

        await saveVideo(file, currentUser.uid);
    };

    const handleEmbedCodeSave = async (newEmbedCode) => {
        if (!currentUser || !canEdit()) {
            console.log('User does not have permission to save embed code');
            return;
        }

        await saveEmbedCode(newEmbedCode, currentUser.uid);
    };

    if (loading) {
        return <div className="editable-loading">Loading video content...</div>;
    }

    if (error) {
        return <div className="editable-error">{error}</div>;
    }

    return (
        <motion.div
            className="video-page-container"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants(isBackNavigation)}
        >
            <div className="video-page-content">
                <h1 className="video-page-title">{title}</h1>
                
                <EditableVideo
                    videoUrl={videoUrl}
                    embedCode={firestoreEmbedCode}
                    title={title}
                    canEdit={canEdit()}
                    isEditing={isEditing}
                    onVideoUpload={handleVideoUpload}
                    onEmbedCodeSave={handleEmbedCodeSave}
                    onEditToggle={() => setIsEditing(!isEditing)}
                    isSaving={isSaving}
                    saveStatus={saveStatus}
                />

                {isUsingEmulator && (
                    <div className="emulator-notice">
                        Using Firebase Emulator
                    </div>
                )}
            </div>
        </motion.div>
    );
};
