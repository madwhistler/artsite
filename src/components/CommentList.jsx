import React from 'react';
import { Trash2 } from 'lucide-react';
import { useComments } from './CommentsContext';
import { useEditor } from './EditorContext';
import { useAuth } from './AuthContext';

const commentStyles = {
    container: {
        marginTop: '1rem',
        marginBottom: '1rem',
    },
    comment: {
        backgroundColor: '#2a2a2a',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '0.75rem',
        position: 'relative',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '0.5rem',
    },
    userName: {
        fontWeight: 'bold',
        color: '#ffcc00',
    },
    date: {
        fontSize: '0.8rem',
        color: '#999',
    },
    text: {
        color: '#fff',
        lineHeight: '1.4',
    },
    deleteButton: {
        position: 'absolute',
        top: '0.5rem',
        right: '0.5rem',
        background: 'none',
        border: 'none',
        color: '#ff6b6b',
        cursor: 'pointer',
        padding: '0.25rem',
        borderRadius: '4px',
    },
    emptyMessage: {
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: '1rem',
    }
};

/**
 * Component to display a list of comments for an artwork
 * @param {Object} props - Component props
 * @param {string} props.artworkId - ID of the artwork
 * @param {number} props.limit - Maximum number of comments to display (optional)
 * @param {boolean} props.showEmpty - Whether to show a message when there are no comments (optional)
 */
const CommentList = ({ artworkId, limit, showEmpty = true }) => {
    const { getCommentsByArtworkId, deleteComment } = useComments();
    const { isEditor } = useEditor();
    const { currentUser } = useAuth();
    
    const comments = getCommentsByArtworkId(artworkId);
    const displayComments = limit ? comments.slice(0, limit) : comments;
    
    const formatDate = (date) => {
        if (!date) return '';
        
        const now = new Date();
        const commentDate = new Date(date);
        const diffMs = now - commentDate;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffSecs < 60) {
            return 'just now';
        } else if (diffMins < 60) {
            return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        } else {
            return commentDate.toLocaleDateString();
        }
    };
    
    const handleDelete = async (commentId) => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            try {
                await deleteComment(commentId);
            } catch (error) {
                console.error('Error deleting comment:', error);
                alert('Failed to delete comment. Please try again.');
            }
        }
    };
    
    if (comments.length === 0 && showEmpty) {
        return (
            <div style={commentStyles.emptyMessage}>
                No comments yet. Be the first to comment!
            </div>
        );
    }
    
    return (
        <div style={commentStyles.container}>
            {displayComments.map(comment => (
                <div key={comment.id} style={commentStyles.comment}>
                    <div style={commentStyles.header}>
                        <span style={commentStyles.userName}>{comment.userName}</span>
                        <span style={commentStyles.date}>{formatDate(comment.createdAt)}</span>
                    </div>
                    <div style={commentStyles.text}>{comment.text}</div>
                    
                    {/* Show delete button for editors or comment owners */}
                    {(isEditor || (currentUser && comment.userId === currentUser.uid)) && (
                        <button 
                            style={commentStyles.deleteButton}
                            onClick={() => handleDelete(comment.id)}
                            title="Delete comment"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

export default CommentList;
