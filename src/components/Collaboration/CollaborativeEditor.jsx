import React, { useState, useEffect } from 'react';
import { useCollaboration } from '../../contexts/CollaborationContext';
import './CollaborativeEditor.css';

const CollaborativeEditor = ({ contentId, initialContent = '', onContentChange }) => {
  const {
    isConnected,
    currentSession,
    participants,
    userCursors,
    userSelections,
    operations,
    version,
    sendOperation,
    updateCursor,
    updateSelection,
    requestLock,
    releaseLock,
    joinSession,
    hasPermission,
    updateAwareness
  } = useCollaboration();

  const [content, setContent] = useState(initialContent);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [isLocked, setIsLocked] = useState(false);
  const [lockingSection, setLockingSection] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  // Join session on mount
  useEffect(() => {
    if (contentId && isConnected && !currentSession) {
      joinSession(contentId, 'edit');
    }
  }, [contentId, isConnected, currentSession, joinSession]);

  // Apply operations from other users
  useEffect(() => {
    operations.forEach(operation => {
      if (operation.userId !== currentSession?.userId) {
        applyOperation(operation.operation);
      }
    });
  }, [operations, currentSession]);

  // Handle content changes
  const handleContentChange = (newContent) => {
    if (!hasPermission('edit')) return;

    const oldContent = content;
    const diff = generateDiff(oldContent, newContent);
    
    if (diff.length > 0) {
      // Send operation to other users
      const operation = {
        type: 'content-change',
        diff,
        position: cursorPosition,
        timestamp: Date.now()
      };

      sendOperation(operation, version + 1);
      setContent(newContent);
      onContentChange?.(newContent);

      // Update typing awareness
      handleTypingUpdate();
    }
  };

  // Handle cursor position changes
  const handleCursorChange = (position) => {
    setCursorPosition(position);
    updateCursor({ position });
  };

  // Handle text selection changes
  const handleSelectionChange = (start, end) => {
    setSelection({ start, end });
    updateSelection({ start, end });
  };

  // Handle typing indicators
  const handleTypingUpdate = () => {
    if (!isTyping) {
      setIsTyping(true);
      updateAwareness({ typing: true, timestamp: Date.now() });
    }

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout
    const newTimeout = setTimeout(() => {
      setIsTyping(false);
      updateAwareness({ typing: false, timestamp: Date.now() });
    }, 2000);

    setTypingTimeout(newTimeout);
  };

  // Request lock before editing sensitive sections
  const handleSectionEdit = async (start, end) => {
    if (isLocked) return;

    try {
      setLockingSection({ start, end });
      await requestLock({ start, end }, 30000);
      setIsLocked(true);
      
      // Auto-release lock after timeout
      setTimeout(() => {
        releaseLock({ start, end });
        setIsLocked(false);
        setLockingSection(null);
      }, 30000);
    } catch (error) {
      console.error('Failed to acquire lock:', error);
      alert('Another user is currently editing this section. Please try again in a moment.');
    }
  };

  // Apply operation from remote user
  const applyOperation = (operation) => {
    switch (operation.type) {
      case 'content-change':
        const newContent = applyDiff(content, operation.diff);
        setContent(newContent);
        onContentChange?.(newContent);
        break;
      default:
        console.warn('Unknown operation type:', operation.type);
    }
  };

  // Generate diff between old and new content
  const generateDiff = (oldText, newText) => {
    const diffs = [];
    
    // Simple diff algorithm - in production, use a library like diff-match-patch
    if (oldText !== newText) {
      diffs.push({
        type: 'replace',
        oldText,
        newText,
        position: 0
      });
    }

    return diffs;
  };

  // Apply diff to content
  const applyDiff = (text, diffs) => {
    let result = text;
    
    diffs.forEach(diff => {
      switch (diff.type) {
        case 'replace':
          result = diff.newText;
          break;
        case 'insert':
          result = result.slice(0, diff.position) + diff.text + result.slice(diff.position);
          break;
        case 'delete':
          result = result.slice(0, diff.position) + result.slice(diff.position + diff.length);
          break;
      }
    });

    return result;
  };

  // Render user cursors
  const renderUserCursors = () => {
    if (!currentSession) return null;

    return Array.from(userCursors.entries()).map(([userId, cursor]) => {
      const user = participants.find(p => p.userId._id === userId)?.userId;
      if (!user || userId === currentSession.userId) return null;

      return (
        <div
          key={userId}
          className="user-cursor"
          style={{
            position: 'absolute',
            left: `${cursor.position * 8}px`, // Approximate character width
            top: '0',
            borderLeft: `2px solid ${cursor.color || '#007bff'}`,
            height: '20px',
            pointerEvents: 'none',
            zIndex: 100
          }}
        >
          <div
            className="user-cursor-label"
            style={{
              backgroundColor: cursor.color || '#007bff',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              transform: 'translateY(-100%)'
            }}
          >
            {user.name}
          </div>
        </div>
      );
    });
  };

  // Render user selections
  const renderUserSelections = () => {
    if (!currentSession) return null;

    return Array.from(userSelections.entries()).map(([userId, selection]) => {
      const user = participants.find(p => p.userId._id === userId)?.userId;
      if (!user || userId === currentSession.userId) return null;

      const width = (selection.end - selection.start) * 8; // Approximate character width
      if (width <= 0) return null;

      return (
        <div
          key={`selection-${userId}`}
          className="user-selection"
          style={{
            position: 'absolute',
            left: `${selection.start * 8}px`,
            top: '0',
            width: `${width}px`,
            height: '20px',
            backgroundColor: `${user.cursor?.color || '#007bff'}20`,
            border: `1px solid ${user.cursor?.color || '#007bff'}40`,
            pointerEvents: 'none',
            zIndex: 99
          }}
        />
      );
    });
  };

  if (!isConnected) {
    return (
      <div className="collaborative-editor-loading">
        <div className="loading-spinner"></div>
        <p>Connecting to collaboration server...</p>
      </div>
    );
  }

  return (
    <div className="collaborative-editor">
      <div className="editor-header">
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        
        {currentSession && (
          <div className="session-info">
            <span className="session-id">Session: {currentSession.sessionId?.slice(-8)}</span>
            <span className="participant-count">{participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <div className="editor-container">
        <div className="editor-content" style={{ position: 'relative' }}>
          {renderUserSelections()}
          {renderUserCursors()}
          
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onSelectionChange={(e) => {
              const { selectionStart, selectionEnd } = e.target;
              handleCursorChange(selectionStart);
              handleSelectionChange(selectionStart, selectionEnd);
            }}
            onClick={(e) => {
              const { selectionStart, selectionEnd } = e.target;
              handleCursorChange(selectionStart);
              handleSelectionChange(selectionStart, selectionEnd);
            }}
            onKeyUp={(e) => {
              const { selectionStart, selectionEnd } = e.target;
              handleCursorChange(selectionStart);
              handleSelectionChange(selectionStart, selectionEnd);
            }}
            placeholder="Start typing to collaborate in real-time..."
            className="content-textarea"
            disabled={!hasPermission('edit')}
            style={{
              width: '100%',
              minHeight: '400px',
              padding: '16px',
              border: '2px solid #e9ecef',
              borderRadius: '8px',
              fontSize: '14px',
              lineHeight: '1.5',
              fontFamily: 'monospace',
              resize: 'vertical',
              position: 'relative',
              zIndex: 1
            }}
          />
        </div>
        
        {isLocked && lockingSection && (
          <div className="lock-indicator">
            <span className="lock-icon">🔒</span>
            You have locked section {lockingSection.start}-{lockingSection.end}
          </div>
        )}
        
        {!hasPermission('edit') && (
          <div className="permission-notice">
            <span className="notice-icon">👁️</span>
            You have view-only access to this content.
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaborativeEditor;