import React from 'react';
import { X, MessageSquare } from 'lucide-react';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import { useComments } from './CommentsContext';

const modalStyles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
    },
    container: {
        position: 'relative',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80vh',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        borderBottom: '1px solid #333',
        paddingBottom: '0.75rem',
    },
    title: {
        fontSize: '1.25rem',
        fontWeight: 'bold',
        color: '#ffcc00',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    closeButton: {
        background: 'none',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        padding: '0.5rem',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        overflowY: 'auto',
        marginBottom: '1rem',
    },
    footer: {
        borderTop: '1px solid #333',
        paddingTop: '1rem',
    }
};

/**
 * Modal component for displaying and adding comments
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {string} props.artworkId - ID of the artwork
 * @param {string} props.artworkName - Name of the artwork
 */
const CommentModal = ({ isOpen, onClose, artworkId, artworkName }) => {
    const { getCommentCount } = useComments();
    const commentCount = getCommentCount(artworkId);
    
    if (!isOpen) return null;
    
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };
    
    return (
        <div style={modalStyles.overlay} onClick={handleOverlayClick}>
            <div style={modalStyles.container}>
                <div style={modalStyles.header}>
                    <div style={modalStyles.title}>
                        <MessageSquare size={20} />
                        <span>
                            Comments {commentCount > 0 ? `(${commentCount})` : ''} - {artworkName}
                        </span>
                    </div>
                    <button style={modalStyles.closeButton} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                
                <div style={modalStyles.content}>
                    <CommentList artworkId={artworkId} />
                </div>
                
                <div style={modalStyles.footer}>
                    <CommentForm artworkId={artworkId} />
                </div>
            </div>
        </div>
    );
};

export default CommentModal;
