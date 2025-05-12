import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { useComments } from './CommentsContext';
import { useAuth } from './AuthContext';

const commentFormStyles = {
    container: {
        marginTop: '1rem',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    },
    inputContainer: {
        display: 'flex',
        position: 'relative',
    },
    input: {
        flex: 1,
        padding: '0.75rem',
        paddingRight: '2.5rem',
        backgroundColor: '#333',
        color: '#fff',
        border: '1px solid #555',
        borderRadius: '4px',
        fontSize: '1rem',
        resize: 'none',
    },
    submitButton: {
        position: 'absolute',
        right: '0.5rem',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        color: '#ffcc00',
        cursor: 'pointer',
        padding: '0.5rem',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginMessage: {
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: '0.5rem',
    },
    error: {
        color: '#ff6b6b',
        fontSize: '0.9rem',
        marginTop: '0.25rem',
    }
};

/**
 * Component for adding comments to an artwork
 * @param {Object} props - Component props
 * @param {string} props.artworkId - ID of the artwork
 * @param {Function} props.onCommentAdded - Callback function when a comment is added (optional)
 */
const CommentForm = ({ artworkId, onCommentAdded }) => {
    const { addComment } = useComments();
    const { currentUser } = useAuth();
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            setError('You must be logged in to comment');
            return;
        }
        
        if (!comment.trim()) {
            setError('Comment cannot be empty');
            return;
        }
        
        setError('');
        setIsSubmitting(true);
        
        try {
            await addComment(artworkId, comment);
            setComment('');
            if (onCommentAdded) {
                onCommentAdded();
            }
        } catch (err) {
            setError(err.message || 'Failed to add comment');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!currentUser) {
        return (
            <div style={commentFormStyles.loginMessage}>
                Please log in to leave a comment.
            </div>
        );
    }
    
    return (
        <div style={commentFormStyles.container}>
            <form style={commentFormStyles.form} onSubmit={handleSubmit}>
                <div style={commentFormStyles.inputContainer}>
                    <textarea
                        style={commentFormStyles.input}
                        placeholder="Add a comment..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={2}
                        disabled={isSubmitting}
                    />
                    <button
                        type="submit"
                        style={commentFormStyles.submitButton}
                        disabled={isSubmitting}
                        title="Post comment"
                    >
                        <Send size={20} />
                    </button>
                </div>
                {error && <div style={commentFormStyles.error}>{error}</div>}
            </form>
        </div>
    );
};

export default CommentForm;
