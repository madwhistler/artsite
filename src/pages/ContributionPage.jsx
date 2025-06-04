import React, { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { NavigationContext } from '../components/NavigationContext';
import { pageVariants } from '../animations/animationVariants';
import { useAuth } from '../components/AuthContext';
import { styles } from '../components/styles';
import { ContributionForm } from '../components/ContributionForm';
import { useFirestoreContent } from '../hooks/useFirestoreContent';
import { EditableContent } from '../components/editable/EditableContent';
import { EditableImage } from '../components/editable/EditableImage';
import { useEditor } from '../components/EditorContext';
import './Editable.css';
import './ContributionPage.css';

/**
 * Contribution Page Component with editable content
 * Allows users to make contributions with editable introduction text
 *
 * @param {Object} props - Component props
 * @param {string} props.backgroundAnimation - Background animation video path
 * @param {string} props.image - Path to the image file
 * @param {string} props.textFile - Path to the text file for editable content
 * @param {boolean} props.anonymous - Whether contributions should be anonymous
 */
export const ContributionPage = ({
  backgroundAnimation = "/animations/Mihu_Frame.mp4",
  image = "/images/moneyrock.png",
  textFile = "/content/SupportContent.html",
  anonymous = false
}) => {
  const { currentUser } = useAuth();
  const { isBackNavigation } = useContext(NavigationContext);
  const [showThankYou, setShowThankYou] = useState(false);
  const [contributionAmount, setContributionAmount] = useState(0);
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
    saveImage,
    clearFirestoreContent
  } = useFirestoreContent(textFile, image);

  // Function to handle manual content clearing
  const handleClearContent = async () => {
    console.log('Manually clearing Firestore content...');
    const wasCleared = await clearFirestoreContent();
    if (wasCleared) {
      console.log('Content was cleared successfully');
      // Reload the page to fetch fresh content
      window.location.reload();
    } else {
      console.log('No incorrect content was found or there was an error clearing content');
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('Content loading state:', { loading, error });
    console.log('Content length:', content?.length);
    console.log('Content preview:', content?.substring(0, 100));
    console.log('Image URL:', imageUrl);

    // Check if content is being loaded correctly
    if (!loading && !error && (!content || content.trim() === '')) {
      console.error('Content is empty after loading!');
      // Try to fetch the content directly
      fetch(textFile)
        .then(response => response.text())
        .then(text => {
          console.log('Direct fetch content length:', text.length);
          console.log('Direct fetch content preview:', text.substring(0, 100));
        })
        .catch(err => console.error('Error fetching content directly:', err));
    }
  }, [content, imageUrl, loading, error, textFile]);

  // Use the editor context to check if the current user is an editor
  const { isEditor } = useEditor();

  // Check if the current user is allowed to edit
  const canEdit = () => {
    return isEditor;
  };

  // Handle content changes in the editor
  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  // Toggle editing mode
  const handleEditToggle = () => {
    if (isEditing) {
      // If canceling edit, revert to original content
      setContent(originalContent);
    }
    setIsEditing(!isEditing);
  };

  // Save content changes
  const handleSaveContent = async () => {
    await saveContent();
    setIsEditing(false);
  };

  // Handle image upload
  const handleImageUpload = async (file) => {
    await saveImage(file);
  };

  // Handle successful contribution
  const handleSuccess = (amount) => {
    setContributionAmount(amount);
    setShowThankYou(true);
    window.scrollTo(0, 0);
  };

  // Reset form to make another contribution
  const handleMakeAnother = () => {
    setShowThankYou(false);
  };

  return (
    <motion.div
      className="contribution-page-container"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants(isBackNavigation)}
    >
      {/* Background animation */}
      {backgroundAnimation && (
        <div className="contribution-background">
          <video
            autoPlay
            loop
            muted
            playsInline
          >
            <source src={backgroundAnimation} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* Content container - with scrollable area */}
      <div className="contribution-content">
        {loading ? (
          <div className="editable-loading">Loading content...</div>
        ) : error ? (
          <div className="editable-error">Error loading content: {error}</div>
        ) : showThankYou ? (
          <div className="thank-you-container">
            <h1 className="thank-you-title">
              Thank You!
            </h1>
            <p className="thank-you-message">
              Your contribution of ${contributionAmount.toFixed(2)} has been received and is deeply appreciated.
              Your support helps make this artistic journey possible.
            </p>
            <button
              onClick={handleMakeAnother}
              className="thank-you-button"
            >
              You are Welcome!
            </button>
          </div>
        ) : (
          <div className="editable-content">
            {/* Editable image */}
            <EditableImage
              imageUrl={imageUrl}
              title="Support Image"
              originalImagePath={image}
              canEdit={canEdit()}
              isEditing={isEditing}
              onImageUpload={handleImageUpload}
              align="right"
            />

            {/* Editable content */}
            <EditableContent
              content={content}
              isEditing={isEditing}
              onChange={handleContentChange}
              onEditToggle={handleEditToggle}
              onSave={handleSaveContent}
              isSaving={isSaving}
              saveStatus={saveStatus}
              canEdit={canEdit()}
              sectionId="support-content"
            />

            {/* Contribution form */}
            <div className="contribution-form-container">
              <ContributionForm
                currentUser={currentUser}
                onSuccess={handleSuccess}
                anonymous={anonymous}
              />
            </div>
          </div>
        )}
      </div>

      {/* Emulator notice */}
      {isUsingEmulator && (
        <div className="emulator-notice">
          Connected to Firebase Emulator
          {error && error.includes('HTML page') && (
            <button
              onClick={handleClearContent}
              className="clear-content-button"
            >
              Clear Incorrect Content
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};
