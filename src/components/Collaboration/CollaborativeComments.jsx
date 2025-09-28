import React, { useState, useEffect } from 'react';
import { useCollaboration } from '../../contexts/CollaborationContext';
import './CollaborativeComments.css';

const CollaborativeComments = ({ contentId, selectedText, selectionRange, onClose }) => {
  const {
    comments,
    currentSession,
    currentUser,
    addComment,
    hasPermission
  } = useCollaboration();

  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState('');
  const [activeReply, setActiveReply] = useState(null);
  const [mentions, setMentions] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unresolved, mine

  // Filter comments based on current filter
  const filteredComments = comments.filter(comment => {
    switch (filter) {
      case 'unresolved':
        return !comment.resolved;
      case 'mine':
        return comment.author._id === currentUser?.id;
      default:
        return true;
    }
  });

  // Handle new comment submission
  const handleAddComment = async () => {
    if (!newComment.trim() || !hasPermission('comment')) return;

    try {
      setLoading(true);
      await addComment(
        newComment,
        selectionRange || { start: 0, end: 0 },
        mentions.map(m => m._id)
      );
      setNewComment('');
      setMentions([]);
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle reply to comment
  const handleReplyToComment = async (commentId) => {
    if (!replyText.trim()) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/v1/collaboration/comment/${commentId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: replyText })
      });

      if (response.ok) {
        setReplyText('');
        setActiveReply(null);
      } else {
        throw new Error('Failed to add reply');
      }
    } catch (error) {
      console.error('Failed to add reply:', error);
      alert('Failed to add reply. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle resolve comment
  const handleResolveComment = async (commentId) => {
    try {
      const response = await fetch(`/api/v1/collaboration/comment/${commentId}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to resolve comment');
      }
    } catch (error) {
      console.error('Failed to resolve comment:', error);
      alert('Failed to resolve comment. Please try again.');
    }
  };

  // Handle mention detection
  const handleCommentChange = (value) => {
    setNewComment(value);
    
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowMentions(true);
      setMentionSearch('');
    } else if (lastAtIndex !== -1) {
      const searchTerm = value.substring(lastAtIndex + 1);
      if (searchTerm.includes(' ')) {
        setShowMentions(false);
      } else {
        setMentionSearch(searchTerm);
        setShowMentions(true);
      }
    } else {
      setShowMentions(false);
    }
  };

  // Add mention to comment
  const addMention = (user) => {
    const lastAtIndex = newComment.lastIndexOf('@');
    const beforeMention = newComment.substring(0, lastAtIndex);
    const afterMention = newComment.substring(lastAtIndex + 1 + mentionSearch.length);
    
    setNewComment(`${beforeMention}@${user.name} ${afterMention}`);
    setMentions(prev => [...prev, user]);
    setShowMentions(false);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return `${Math.round(diffInHours * 60)} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.round(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="collaborative-comments">
      <div className="comments-header">
        <h3>Comments</h3>
        <div className="header-actions">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Comments</option>
            <option value="unresolved">Unresolved</option>
            <option value="mine">My Comments</option>
          </select>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>

      <div className="comments-content">
        {/* New Comment Form */}
        {hasPermission('comment') && (
          <div className="new-comment-form">
            {selectedText && (
              <div className="selected-text-preview">
                <div className="preview-label">Commenting on:</div>
                <div className="preview-text">"{selectedText}"</div>
              </div>
            )}
            
            <div className="comment-input-container">
              <textarea
                value={newComment}
                onChange={(e) => handleCommentChange(e.target.value)}
                placeholder="Add a comment..."
                className="comment-textarea"
                rows="3"
              />
              
              {showMentions && (
                <div className="mentions-dropdown">
                  {/* In a real implementation, you'd filter participants by mentionSearch */}
                  <div className="mentions-header">Mention someone:</div>
                  {/* Placeholder mention options */}
                  <div className="mention-option" onClick={() => addMention({ _id: '1', name: 'John Doe' })}>
                    <div className="mention-avatar">J</div>
                    <div className="mention-name">John Doe</div>
                  </div>
                </div>
              )}
            </div>

            {mentions.length > 0 && (
              <div className="mentions-preview">
                <span>Mentioning: </span>
                {mentions.map(mention => (
                  <span key={mention._id} className="mention-tag">
                    @{mention.name}
                  </span>
                ))}
              </div>
            )}

            <div className="comment-actions">
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || loading}
                className="add-comment-button"
              >
                {loading ? 'Adding...' : 'Add Comment'}
              </button>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="comments-list">
          {filteredComments.length === 0 ? (
            <div className="no-comments">
              <div className="no-comments-icon">💬</div>
              <h4>No comments yet</h4>
              <p>
                {filter === 'all' 
                  ? 'Be the first to add a comment!'
                  : `No ${filter} comments found.`
                }
              </p>
            </div>
          ) : (
            filteredComments.map((comment) => (
              <div 
                key={comment._id} 
                className={`comment-item ${comment.resolved ? 'resolved' : ''}`}
              >
                <div className="comment-header">
                  <div className="comment-author">
                    <div className="author-avatar">
                      {comment.author.avatar ? (
                        <img src={comment.author.avatar} alt={comment.author.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {comment.author.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="author-info">
                      <div className="author-name">{comment.author.name}</div>
                      <div className="comment-time">{formatDate(comment.createdAt)}</div>
                    </div>
                  </div>
                  
                  <div className="comment-status">
                    {comment.resolved && (
                      <span className="resolved-badge">✅ Resolved</span>
                    )}
                  </div>
                </div>

                <div className="comment-content">
                  {comment.content}
                </div>

                {comment.position && (
                  <div className="comment-context">
                    Referenced text: "{comment.position.text || 'Selected content'}"
                  </div>
                )}

                <div className="comment-actions">
                  <button
                    onClick={() => setActiveReply(activeReply === comment._id ? null : comment._id)}
                    className="reply-button"
                  >
                    💬 Reply ({comment.thread?.length || 0})
                  </button>
                  
                  {!comment.resolved && hasPermission('edit') && (
                    <button
                      onClick={() => handleResolveComment(comment._id)}
                      className="resolve-button"
                    >
                      ✅ Resolve
                    </button>
                  )}
                </div>

                {/* Reply Form */}
                {activeReply === comment._id && (
                  <div className="reply-form">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="reply-textarea"
                      rows="2"
                    />
                    <div className="reply-actions">
                      <button
                        onClick={() => handleReplyToComment(comment._id)}
                        disabled={!replyText.trim() || loading}
                        className="submit-reply-button"
                      >
                        {loading ? 'Sending...' : 'Reply'}
                      </button>
                      <button
                        onClick={() => {
                          setActiveReply(null);
                          setReplyText('');
                        }}
                        className="cancel-reply-button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Thread Replies */}
                {comment.thread && comment.thread.length > 0 && (
                  <div className="comment-thread">
                    {comment.thread.map((reply, index) => (
                      <div key={index} className="thread-reply">
                        <div className="reply-author">
                          <div className="author-avatar-small">
                            {reply.author.avatar ? (
                              <img src={reply.author.avatar} alt={reply.author.name} />
                            ) : (
                              <div className="avatar-placeholder-small">
                                {reply.author.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="reply-author-name">{reply.author.name}</div>
                          <div className="reply-time">{formatDate(reply.createdAt)}</div>
                        </div>
                        <div className="reply-content">{reply.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborativeComments;