import React, { useState } from 'react';
import { useCollaboration } from '../../contexts/CollaborationContext';
import './ParticipantsList.css';

const ParticipantsList = ({ onClose }) => {
  const {
    participants,
    currentSession,
    currentUser,
    isSessionOwner,
    userAwareness,
    userCursors
  } = useCollaboration();

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermissions, setInvitePermissions] = useState('edit');
  const [inviting, setInviting] = useState(false);

  // Get user status (typing, idle, etc.)
  const getUserStatus = (userId) => {
    const awareness = userAwareness.get(userId);
    if (!awareness) return 'idle';
    
    if (awareness.typing) {
      return 'typing';
    }
    
    const lastActivity = new Date(awareness.timestamp);
    const now = new Date();
    const timeDiff = now - lastActivity;
    
    if (timeDiff < 30000) return 'active'; // 30 seconds
    if (timeDiff < 300000) return 'idle'; // 5 minutes
    return 'away';
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'typing': return '#28a745';
      case 'active': return '#007bff';
      case 'idle': return '#ffc107';
      case 'away': return '#6c757d';
      default: return '#6c757d';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'typing': return 'Typing...';
      case 'active': return 'Active';
      case 'idle': return 'Idle';
      case 'away': return 'Away';
      default: return 'Offline';
    }
  };

  // Get permission badge color
  const getPermissionColor = (permission) => {
    switch (permission) {
      case 'admin': return '#dc3545';
      case 'edit': return '#28a745';
      case 'comment': return '#ffc107';
      case 'view': return '#6c757d';
      default: return '#6c757d';
    }
  };

  // Handle invite user
  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !isSessionOwner) return;

    try {
      setInviting(true);
      
      // API call to invite user
      const response = await fetch(`/api/v1/collaboration/session/${currentSession.sessionId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: inviteEmail,
          permissions: invitePermissions
        })
      });

      if (response.ok) {
        setInviteEmail('');
        setShowInvite(false);
        // Show success message
        alert(`Invitation sent to ${inviteEmail}`);
      } else {
        throw new Error('Failed to send invitation');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      alert('Failed to send invitation. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  // Handle permission change
  const handlePermissionChange = async (userId, newPermissions) => {
    if (!isSessionOwner) return;

    try {
      const response = await fetch(`/api/v1/collaboration/session/${currentSession.sessionId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId,
          permissions: newPermissions
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update permissions');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Failed to update permissions. Please try again.');
    }
  };

  // Handle remove participant
  const handleRemoveParticipant = async (userId) => {
    if (!isSessionOwner || userId === currentUser?.id) return;

    if (window.confirm('Are you sure you want to remove this participant?')) {
      try {
        const response = await fetch(`/api/v1/collaboration/session/${currentSession.sessionId}/participants/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getToken('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to remove participant');
        }
      } catch (error) {
        console.error('Error removing participant:', error);
        alert('Failed to remove participant. Please try again.');
      }
    }
  };

  return (
    <div className="participants-list">
      <div className="participants-header">
        <h3>Participants ({participants.length})</h3>
        <button className="close-button" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="participants-content">
        <div className="participants-grid">
          {participants.map((participant) => {
            const user = participant.userId;
            const status = getUserStatus(user._id);
            const cursor = userCursors.get(user._id);
            const isCurrentUser = user._id === currentUser?.id;
            const isOwner = currentSession?.owner?.id === user._id;

            return (
              <div 
                key={user._id}
                className={`participant-item ${isCurrentUser ? 'current-user' : ''} ${isOwner ? 'owner' : ''}`}
              >
                <div className="participant-avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                  ) : (
                    <div 
                      className="avatar-placeholder"
                      style={{ backgroundColor: cursor?.color || '#007bff' }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div 
                    className="status-indicator"
                    style={{ backgroundColor: getStatusColor(status) }}
                  />
                </div>

                <div className="participant-info">
                  <div className="participant-name">
                    {user.name}
                    {isCurrentUser && <span className="you-label">(You)</span>}
                    {isOwner && <span className="owner-label">👑</span>}
                  </div>
                  <div className="participant-email">{user.email}</div>
                  <div className="participant-status">{getStatusText(status)}</div>
                </div>

                <div className="participant-actions">
                  <div 
                    className="permission-badge"
                    style={{ backgroundColor: getPermissionColor(participant.permissions) }}
                  >
                    {participant.permissions}
                  </div>

                  {isSessionOwner && !isCurrentUser && (
                    <div className="action-buttons">
                      <select
                        value={participant.permissions}
                        onChange={(e) => handlePermissionChange(user._id, e.target.value)}
                        className="permission-select"
                      >
                        <option value="view">View</option>
                        <option value="comment">Comment</option>
                        <option value="edit">Edit</option>
                        <option value="admin">Admin</option>
                      </select>
                      
                      <button
                        onClick={() => handleRemoveParticipant(user._id)}
                        className="remove-button"
                        title="Remove participant"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>

                {participant.lastActivity && (
                  <div className="last-activity">
                    Last active: {new Date(participant.lastActivity).toLocaleTimeString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isSessionOwner && (
          <div className="invite-section">
            {!showInvite ? (
              <button
                onClick={() => setShowInvite(true)}
                className="invite-button"
              >
                <span className="button-icon">➕</span>
                Invite Collaborator
              </button>
            ) : (
              <div className="invite-form">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="invite-email-input"
                />
                
                <select
                  value={invitePermissions}
                  onChange={(e) => setInvitePermissions(e.target.value)}
                  className="invite-permission-select"
                >
                  <option value="view">View Only</option>
                  <option value="comment">Can Comment</option>
                  <option value="edit">Can Edit</option>
                  <option value="admin">Admin</option>
                </select>

                <div className="invite-actions">
                  <button
                    onClick={handleInviteUser}
                    disabled={!inviteEmail.trim() || inviting}
                    className="send-invite-button"
                  >
                    {inviting ? 'Sending...' : 'Send Invite'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowInvite(false);
                      setInviteEmail('');
                    }}
                    className="cancel-invite-button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="participants-footer">
        <div className="session-info">
          <div className="info-item">
            <span className="info-label">Session:</span>
            <span className="info-value">{currentSession?.sessionId?.slice(-8)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Created:</span>
            <span className="info-value">
              {currentSession?.createdAt ? new Date(currentSession.createdAt).toLocaleString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantsList;