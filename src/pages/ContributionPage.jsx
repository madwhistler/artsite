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
      style={{
        ...styles.pageContainer,
        backgroundColor: '#000',
        color: '#fff',
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '40px 20px',
        overflowX: 'hidden' // Prevent horizontal scrolling on the main page
      }}
    >
      {/* Background animation */}
      {backgroundAnimation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          opacity: 0.3,
          overflow: 'hidden'
        }}>
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          >
            <source src={backgroundAnimation} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* Content container - with scrollable area */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '800px',
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '10px',
        padding: '30px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        marginBottom: '40px',
        maxHeight: '80vh', // Limit height to 80% of viewport
        overflowY: 'auto', // Enable vertical scrolling
        display: 'flex',
        flexDirection: 'column'
      }}>
        {loading ? (
          <div className="editable-loading">Loading content...</div>
        ) : error ? (
          <div className="editable-error">Error loading content: {error}</div>
        ) : showThankYou ? (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontSize: '2.5rem',
              marginBottom: '20px',
              color: '#f8c630'
            }}>
              Thank You!
            </h1>
            <p style={{
              fontSize: '1.2rem',
              lineHeight: '1.6',
              marginBottom: '30px'
            }}>
              Your contribution of ${contributionAmount.toFixed(2)} has been received and is deeply appreciated.
              Your support helps make this artistic journey possible.
            </p>
            <button
              onClick={handleMakeAnother}
              style={{
                backgroundColor: '#f8c630',
                color: '#000',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '5px',
                fontSize: '1rem',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s ease'
              }}
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
            <div style={{
              marginTop: '30px',
              clear: 'both',
              paddingBottom: '20px' // Add padding at the bottom for better scrolling
            }}>
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
              style={{
                marginLeft: '10px',
                padding: '5px 10px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Clear Incorrect Content
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};
