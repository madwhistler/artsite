import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { useEditor } from '../components/EditorContext';
import { useFirestoreMultiContent } from '../hooks/useFirestoreMultiContent';
import { EditableSection } from '../components/editable/EditableSection';
import '../components/editable/EditableSection.css';
import './Editable.css';

/**
 * Enhanced Editable component that supports multiple content sections
 * Each section can have an image with configurable alignment and text content
 *
 * @param {string} title - The title of the page
 * @param {Array} sections - Array of section objects with image, content, and align properties
 */
export const EditableMulti = ({ title, sections = [], pageId }) => {
    const { currentUser } = useAuth();
    const { isEditor } = useEditor();
    const [editingSectionId, setEditingSectionId] = useState(null);

    // Use our custom hook to handle Firestore content
    const {
        sections: sectionsData,
        loading,
        error,
        isUsingEmulator,
        savingSection,
        saveSectionContent,
        saveSectionImage
    } = useFirestoreMultiContent(pageId || title, sections);

    // Check if the current user is allowed to edit
    const canEdit = () => {
        if (!currentUser) return false;
        return isEditor;
    };

    // No need for the useEffect to load sections - our hook handles that

    // Handle editing toggle for a specific section
    const handleEditToggle = (sectionId) => {
        if (editingSectionId === sectionId) {
            // Cancel editing for this section - revert to original content
            setEditingSectionId(null);
        } else {
            // Start editing this section
            setEditingSectionId(sectionId);
        }
    };

    // Handle content change for a specific section
    const handleContentChange = (sectionId, newContent) => {
        // This is called when the textarea content changes
        // We need to update the content in our sections state
        console.log(`Content changed for section ${sectionId}`);

        // Find the section in our state and update its content
        const updatedSections = sectionsData.map(section =>
            section.id === sectionId ? { ...section, content: newContent } : section
        );

        // We don't need to call setSections here as it's handled by the hook
    };

    // Handle save for a specific section
    const handleSave = async (sectionId) => {
        if (!currentUser) {
            console.log('No user logged in');
            return;
        }

        if (!canEdit()) {
            console.log('User does not have edit permission');
            return;
        }

        try {
            // Get the content from the textarea
            const textarea = document.getElementById(`textarea-${sectionId}`);
            if (!textarea) {
                console.error(`Textarea with ID textarea-${sectionId} not found`);
                return;
            }

            const content = textarea.value;
            console.log(`Saving content for section ${sectionId}`);

            // Find the section in our state to get the current content
            const section = sectionsData.find(s => s.id === sectionId);
            if (!section) {
                console.error(`Section with ID ${sectionId} not found in state`);
                return;
            }

            const success = await saveSectionContent(sectionId, content, currentUser.uid);
            if (success) {
                setEditingSectionId(null);
            }
        } catch (err) {
            console.error(`Error in handleSave for section ${sectionId}:`, err);
        }
    };

    // Handle image upload for a specific section
    const handleImageUpload = async (sectionId, file) => {
        if (!currentUser || !canEdit()) {
            console.log('User does not have permission to upload images');
            return;
        }

        await saveSectionImage(sectionId, file, currentUser.uid);
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

            <div className="editable-sections">
                {sectionsData && sectionsData.length > 0 ? (
                    sectionsData.map(section => (
                        <EditableSection
                            key={section.id}
                            sectionId={section.id}
                            content={section.content}
                            imageUrl={section.imageUrl}
                            originalImagePath={section.originalImagePath}
                            align={section.align}
                            isEditing={editingSectionId === section.id}
                            onChange={handleContentChange}
                            onEditToggle={handleEditToggle}
                            onSave={handleSave}
                            onImageUpload={handleImageUpload}
                            isSaving={savingSection === section.id}
                            saveStatus={section.saveStatus}
                            canEdit={canEdit()}
                        />
                    ))
                ) : (
                    <div className="editable-no-sections">
                        <p>No content sections found. Please check your configuration.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
