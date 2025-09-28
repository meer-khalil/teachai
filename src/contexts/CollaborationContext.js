import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

// Initial state
const initialState = {
  // Connection state
  socket: null,
  isConnected: false,
  connectionStatus: 'disconnected',
  
  // Session state
  currentSession: null,
  sessionId: null,
  participants: [],
  isSessionOwner: false,
  
  // User state
  currentUser: null,
  userCursor: { position: 0, selection: { start: 0, end: 0 } },
  
  // Real-time collaboration
  operations: [],
  version: 0,
  pendingOperations: [],
  acknowledgedOperations: new Set(),
  
  // Cursors and selections
  userCursors: new Map(),
  userSelections: new Map(),
  
  // Locks and conflicts
  locks: [],
  contentLocks: new Map(),
  
  // Comments
  comments: [],
  activeComment: null,
  commentThread: null,
  
  // Awareness (typing indicators, etc.)
  userAwareness: new Map(),
  
  // UI state
  showParticipants: true,
  showComments: true,
  conflictResolution: null,
  
  // Loading and error states
  loading: {
    connecting: false,
    joiningSession: false,
    operations: false,
    comments: false
  },
  errors: {
    connection: null,
    session: null,
    operation: null,
    comment: null
  }
};

// Action types
const COLLABORATION_ACTIONS = {
  // Connection actions
  SET_SOCKET: 'SET_SOCKET',
  SET_CONNECTION_STATUS: 'SET_CONNECTION_STATUS',
  SET_CONNECTED: 'SET_CONNECTED',
  
  // Session actions
  SET_CURRENT_SESSION: 'SET_CURRENT_SESSION',
  SET_SESSION_ID: 'SET_SESSION_ID',
  SET_PARTICIPANTS: 'SET_PARTICIPANTS',
  ADD_PARTICIPANT: 'ADD_PARTICIPANT',
  REMOVE_PARTICIPANT: 'REMOVE_PARTICIPANT',
  UPDATE_PARTICIPANT: 'UPDATE_PARTICIPANT',
  
  // User actions
  SET_CURRENT_USER: 'SET_CURRENT_USER',
  UPDATE_USER_CURSOR: 'UPDATE_USER_CURSOR',
  
  // Operation actions
  ADD_OPERATION: 'ADD_OPERATION',
  ADD_PENDING_OPERATION: 'ADD_PENDING_OPERATION',
  ACKNOWLEDGE_OPERATION: 'ACKNOWLEDGE_OPERATION',
  SET_VERSION: 'SET_VERSION',
  APPLY_OPERATIONS: 'APPLY_OPERATIONS',
  
  // Cursor and selection actions
  UPDATE_USER_CURSORS: 'UPDATE_USER_CURSORS',
  UPDATE_USER_SELECTIONS: 'UPDATE_USER_SELECTIONS',
  
  // Lock actions
  SET_LOCKS: 'SET_LOCKS',
  ADD_LOCK: 'ADD_LOCK',
  REMOVE_LOCK: 'REMOVE_LOCK',
  UPDATE_CONTENT_LOCKS: 'UPDATE_CONTENT_LOCKS',
  
  // Comment actions
  SET_COMMENTS: 'SET_COMMENTS',
  ADD_COMMENT: 'ADD_COMMENT',
  UPDATE_COMMENT: 'UPDATE_COMMENT',
  SET_ACTIVE_COMMENT: 'SET_ACTIVE_COMMENT',
  SET_COMMENT_THREAD: 'SET_COMMENT_THREAD',
  
  // Awareness actions
  UPDATE_USER_AWARENESS: 'UPDATE_USER_AWARENESS',
  
  // UI actions
  TOGGLE_PARTICIPANTS: 'TOGGLE_PARTICIPANTS',
  TOGGLE_COMMENTS: 'TOGGLE_COMMENTS',
  SET_CONFLICT_RESOLUTION: 'SET_CONFLICT_RESOLUTION',
  
  // Loading actions
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer function
const collaborationReducer = (state, action) => {
  switch (action.type) {
    case COLLABORATION_ACTIONS.SET_SOCKET:
      return { ...state, socket: action.payload };
      
    case COLLABORATION_ACTIONS.SET_CONNECTION_STATUS:
      return { ...state, connectionStatus: action.payload };
      
    case COLLABORATION_ACTIONS.SET_CONNECTED:
      return { ...state, isConnected: action.payload };
      
    case COLLABORATION_ACTIONS.SET_CURRENT_SESSION:
      return { 
        ...state, 
        currentSession: action.payload,
        isSessionOwner: action.payload ? action.payload.owner.id === state.currentUser?.id : false
      };
      
    case COLLABORATION_ACTIONS.SET_SESSION_ID:
      return { ...state, sessionId: action.payload };
      
    case COLLABORATION_ACTIONS.SET_PARTICIPANTS:
      return { ...state, participants: action.payload };
      
    case COLLABORATION_ACTIONS.ADD_PARTICIPANT:
      return {
        ...state,
        participants: [...state.participants, action.payload]
      };
      
    case COLLABORATION_ACTIONS.REMOVE_PARTICIPANT:
      return {
        ...state,
        participants: state.participants.filter(p => p.userId._id !== action.payload.userId)
      };
      
    case COLLABORATION_ACTIONS.UPDATE_PARTICIPANT:
      return {
        ...state,
        participants: state.participants.map(p => 
          p.userId._id === action.payload.userId 
            ? { ...p, ...action.payload.updates }
            : p
        )
      };
      
    case COLLABORATION_ACTIONS.SET_CURRENT_USER:
      return { ...state, currentUser: action.payload };
      
    case COLLABORATION_ACTIONS.UPDATE_USER_CURSOR:
      return { ...state, userCursor: { ...state.userCursor, ...action.payload } };
      
    case COLLABORATION_ACTIONS.ADD_OPERATION:
      return {
        ...state,
        operations: [...state.operations, action.payload]
      };
      
    case COLLABORATION_ACTIONS.ADD_PENDING_OPERATION:
      return {
        ...state,
        pendingOperations: [...state.pendingOperations, action.payload]
      };
      
    case COLLABORATION_ACTIONS.ACKNOWLEDGE_OPERATION:
      const newAcknowledged = new Set(state.acknowledgedOperations);
      newAcknowledged.add(action.payload);
      return {
        ...state,
        acknowledgedOperations: newAcknowledged,
        pendingOperations: state.pendingOperations.filter(op => op.id !== action.payload)
      };
      
    case COLLABORATION_ACTIONS.SET_VERSION:
      return { ...state, version: action.payload };
      
    case COLLABORATION_ACTIONS.APPLY_OPERATIONS:
      return {
        ...state,
        operations: [...state.operations, ...action.payload.operations],
        version: action.payload.version
      };
      
    case COLLABORATION_ACTIONS.UPDATE_USER_CURSORS:
      const newCursors = new Map(state.userCursors);
      newCursors.set(action.payload.userId, action.payload.cursor);
      return { ...state, userCursors: newCursors };
      
    case COLLABORATION_ACTIONS.UPDATE_USER_SELECTIONS:
      const newSelections = new Map(state.userSelections);
      newSelections.set(action.payload.userId, action.payload.selection);
      return { ...state, userSelections: newSelections };
      
    case COLLABORATION_ACTIONS.SET_LOCKS:
      return { ...state, locks: action.payload };
      
    case COLLABORATION_ACTIONS.ADD_LOCK:
      return { ...state, locks: [...state.locks, action.payload] };
      
    case COLLABORATION_ACTIONS.REMOVE_LOCK:
      return {
        ...state,
        locks: state.locks.filter(lock => 
          !(lock.userId === action.payload.userId && 
            lock.section.start === action.payload.section.start &&
            lock.section.end === action.payload.section.end)
        )
      };
      
    case COLLABORATION_ACTIONS.UPDATE_CONTENT_LOCKS:
      const newContentLocks = new Map(state.contentLocks);
      newContentLocks.set(action.payload.section, action.payload.lock);
      return { ...state, contentLocks: newContentLocks };
      
    case COLLABORATION_ACTIONS.SET_COMMENTS:
      return { ...state, comments: action.payload };
      
    case COLLABORATION_ACTIONS.ADD_COMMENT:
      return { ...state, comments: [...state.comments, action.payload] };
      
    case COLLABORATION_ACTIONS.UPDATE_COMMENT:
      return {
        ...state,
        comments: state.comments.map(comment =>
          comment._id === action.payload.id
            ? { ...comment, ...action.payload.updates }
            : comment
        )
      };
      
    case COLLABORATION_ACTIONS.SET_ACTIVE_COMMENT:
      return { ...state, activeComment: action.payload };
      
    case COLLABORATION_ACTIONS.SET_COMMENT_THREAD:
      return { ...state, commentThread: action.payload };
      
    case COLLABORATION_ACTIONS.UPDATE_USER_AWARENESS:
      const newAwareness = new Map(state.userAwareness);
      newAwareness.set(action.payload.userId, action.payload.awareness);
      return { ...state, userAwareness: newAwareness };
      
    case COLLABORATION_ACTIONS.TOGGLE_PARTICIPANTS:
      return { ...state, showParticipants: !state.showParticipants };
      
    case COLLABORATION_ACTIONS.TOGGLE_COMMENTS:
      return { ...state, showComments: !state.showComments };
      
    case COLLABORATION_ACTIONS.SET_CONFLICT_RESOLUTION:
      return { ...state, conflictResolution: action.payload };
      
    case COLLABORATION_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: { ...state.loading, [action.payload.key]: action.payload.value }
      };
      
    case COLLABORATION_ACTIONS.SET_ERROR:
      return {
        ...state,
        errors: { ...state.errors, [action.payload.key]: action.payload.value }
      };
      
    case COLLABORATION_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        errors: { ...state.errors, [action.payload]: null }
      };
      
    default:
      return state;
  }
};

// Create context
const CollaborationContext = createContext();

// Provider component
export const CollaborationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(collaborationReducer, initialState);

  // Initialize socket connection
  const initializeSocket = useCallback((token) => {
    if (state.socket) {
      state.socket.disconnect();
    }

    dispatch({ type: COLLABORATION_ACTIONS.SET_LOADING, payload: { key: 'connecting', value: true } });

    const newSocket = io(process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:4000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    // Socket event listeners
    newSocket.on('connect', () => {
      console.log('Connected to collaboration server');
      dispatch({ type: COLLABORATION_ACTIONS.SET_CONNECTED, payload: true });
      dispatch({ type: COLLABORATION_ACTIONS.SET_CONNECTION_STATUS, payload: 'connected' });
      dispatch({ type: COLLABORATION_ACTIONS.SET_LOADING, payload: { key: 'connecting', value: false } });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from collaboration server');
      dispatch({ type: COLLABORATION_ACTIONS.SET_CONNECTED, payload: false });
      dispatch({ type: COLLABORATION_ACTIONS.SET_CONNECTION_STATUS, payload: 'disconnected' });
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      dispatch({ type: COLLABORATION_ACTIONS.SET_ERROR, payload: { key: 'connection', value: error.message } });
      dispatch({ type: COLLABORATION_ACTIONS.SET_LOADING, payload: { key: 'connecting', value: false } });
    });

    // Session events
    newSocket.on('session-joined', (data) => {
      dispatch({ type: COLLABORATION_ACTIONS.SET_CURRENT_SESSION, payload: data });
      dispatch({ type: COLLABORATION_ACTIONS.SET_SESSION_ID, payload: data.sessionId });
      dispatch({ type: COLLABORATION_ACTIONS.SET_PARTICIPANTS, payload: data.participants });
      dispatch({ type: COLLABORATION_ACTIONS.SET_LOCKS, payload: data.locks });
    });

    newSocket.on('user-joined', (data) => {
      dispatch({ type: COLLABORATION_ACTIONS.ADD_PARTICIPANT, payload: data.participant });
    });

    newSocket.on('user-left', (data) => {
      dispatch({ type: COLLABORATION_ACTIONS.REMOVE_PARTICIPANT, payload: data });
    });

    // Operation events
    newSocket.on('operation', (data) => {
      dispatch({ type: COLLABORATION_ACTIONS.ADD_OPERATION, payload: data });
    });

    // Cursor and selection events
    newSocket.on('cursor-update', (data) => {
      dispatch({ type: COLLABORATION_ACTIONS.UPDATE_USER_CURSORS, payload: data });
    });

    newSocket.on('selection-update', (data) => {
      dispatch({ type: COLLABORATION_ACTIONS.UPDATE_USER_SELECTIONS, payload: data });
    });

    // Lock events
    newSocket.on('section-locked', (data) => {
      dispatch({ type: COLLABORATION_ACTIONS.ADD_LOCK, payload: data });
    });

    newSocket.on('section-unlocked', (data) => {
      dispatch({ type: COLLABORATION_ACTIONS.REMOVE_LOCK, payload: data });
    });

    newSocket.on('lock-acquired', (data) => {
      dispatch({ type: COLLABORATION_ACTIONS.UPDATE_CONTENT_LOCKS, payload: { section: data.section, lock: data } });
    });

    newSocket.on('lock-denied', (data) => {
      dispatch({ type: COLLABORATION_ACTIONS.SET_ERROR, payload: { key: 'operation', value: data.reason } });
    });

    // Comment events
    newSocket.on('comment-added', (data) => {
      dispatch({ type: COLLABORATION_ACTIONS.ADD_COMMENT, payload: data.comment });
    });

    newSocket.on('comment-reply', (data) => {
      dispatch({ type: COLLABORATION_ACTIONS.UPDATE_COMMENT, payload: { id: data.commentId, updates: { thread: data.reply } } });
    });

    // Awareness events
    newSocket.on('awareness-update', (data) => {
      dispatch({ type: COLLABORATION_ACTIONS.UPDATE_USER_AWARENESS, payload: data });
    });

    // Error events
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      dispatch({ type: COLLABORATION_ACTIONS.SET_ERROR, payload: { key: 'session', value: error.message } });
    });

    dispatch({ type: COLLABORATION_ACTIONS.SET_SOCKET, payload: newSocket });
  }, [state.socket]);

  // Join collaboration session
  const joinSession = useCallback(async (contentId, permissions = 'edit') => {
    try {
      dispatch({ type: COLLABORATION_ACTIONS.SET_LOADING, payload: { key: 'joiningSession', value: true } });

      // API call to create or join session
      const response = await fetch(`/api/v1/collaboration/content/${contentId}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ permissions })
      });

      if (!response.ok) {
        throw new Error('Failed to join session');
      }

      const data = await response.json();
      const session = data.data.session;

      // Join socket room
      if (state.socket) {
        state.socket.emit('join-session', { sessionId: session.sessionId });
      }

      dispatch({ type: COLLABORATION_ACTIONS.SET_LOADING, payload: { key: 'joiningSession', value: false } });

      return session;
    } catch (error) {
      dispatch({ type: COLLABORATION_ACTIONS.SET_ERROR, payload: { key: 'session', value: error.message } });
      dispatch({ type: COLLABORATION_ACTIONS.SET_LOADING, payload: { key: 'joiningSession', value: false } });
      throw error;
    }
  }, [state.socket]);

  // Leave collaboration session
  const leaveSession = useCallback(async () => {
    if (!state.sessionId || !state.socket) return;

    try {
      // Emit leave event
      state.socket.emit('leave-session', { sessionId: state.sessionId });

      // API call to leave session
      await fetch(`/api/v1/collaboration/session/${state.sessionId}/leave`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Reset session state
      dispatch({ type: COLLABORATION_ACTIONS.SET_CURRENT_SESSION, payload: null });
      dispatch({ type: COLLABORATION_ACTIONS.SET_SESSION_ID, payload: null });
      dispatch({ type: COLLABORATION_ACTIONS.SET_PARTICIPANTS, payload: [] });
      dispatch({ type: COLLABORATION_ACTIONS.SET_LOCKS, payload: [] });
    } catch (error) {
      console.error('Error leaving session:', error);
    }
  }, [state.sessionId, state.socket]);

  // Send operation
  const sendOperation = useCallback((operation, version) => {
    if (!state.socket || !state.sessionId) return;

    const operationData = {
      sessionId: state.sessionId,
      operation,
      version
    };

    // Add to pending operations
    dispatch({ type: COLLABORATION_ACTIONS.ADD_PENDING_OPERATION, payload: { ...operationData, id: Date.now() } });

    // Send to server
    state.socket.emit('operation', operationData);
  }, [state.socket, state.sessionId]);

  // Update cursor position
  const updateCursor = useCallback((cursor) => {
    if (!state.socket || !state.sessionId) return;

    dispatch({ type: COLLABORATION_ACTIONS.UPDATE_USER_CURSOR, payload: cursor });
    state.socket.emit('cursor-update', {
      sessionId: state.sessionId,
      cursor
    });
  }, [state.socket, state.sessionId]);

  // Update selection
  const updateSelection = useCallback((selection) => {
    if (!state.socket || !state.sessionId) return;

    state.socket.emit('selection-update', {
      sessionId: state.sessionId,
      selection
    });
  }, [state.socket, state.sessionId]);

  // Request content lock
  const requestLock = useCallback(async (section, timeout = 30000) => {
    if (!state.socket || !state.sessionId) return;

    return new Promise((resolve, reject) => {
      const lockTimeout = setTimeout(() => {
        reject(new Error('Lock request timeout'));
      }, 5000);

      state.socket.emit('request-lock', {
        sessionId: state.sessionId,
        section,
        timeout
      });

      const handleLockAcquired = (data) => {
        clearTimeout(lockTimeout);
        state.socket.off('lock-acquired', handleLockAcquired);
        state.socket.off('lock-denied', handleLockDenied);
        resolve(data);
      };

      const handleLockDenied = (data) => {
        clearTimeout(lockTimeout);
        state.socket.off('lock-acquired', handleLockAcquired);
        state.socket.off('lock-denied', handleLockDenied);
        reject(new Error(data.reason));
      };

      state.socket.on('lock-acquired', handleLockAcquired);
      state.socket.on('lock-denied', handleLockDenied);
    });
  }, [state.socket, state.sessionId]);

  // Release content lock
  const releaseLock = useCallback((section) => {
    if (!state.socket || !state.sessionId) return;

    state.socket.emit('release-lock', {
      sessionId: state.sessionId,
      section
    });
  }, [state.socket, state.sessionId]);

  // Add comment
  const addComment = useCallback(async (content, position, mentions = []) => {
    try {
      const response = await fetch(`/api/v1/collaboration/content/${state.currentSession?.contentId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sessionId: state.sessionId,
          content,
          position,
          mentions
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const data = await response.json();
      
      // Emit to socket for real-time update
      if (state.socket) {
        state.socket.emit('comment-add', {
          sessionId: state.sessionId,
          comment: data.data.comment
        });
      }

      return data.data.comment;
    } catch (error) {
      dispatch({ type: COLLABORATION_ACTIONS.SET_ERROR, payload: { key: 'comment', value: error.message } });
      throw error;
    }
  }, [state.socket, state.sessionId, state.currentSession]);

  // Update awareness (typing indicators, etc.)
  const updateAwareness = useCallback((awareness) => {
    if (!state.socket || !state.sessionId) return;

    state.socket.emit('awareness-update', {
      sessionId: state.sessionId,
      awareness
    });
  }, [state.socket, state.sessionId]);

  // Get user by ID
  const getUserById = useCallback((userId) => {
    return state.participants.find(p => p.userId._id === userId)?.userId;
  }, [state.participants]);

  // Check if user has permission
  const hasPermission = useCallback((permission) => {
    if (!state.currentUser || !state.participants) return false;
    
    const participant = state.participants.find(p => p.userId._id === state.currentUser.id);
    if (!participant) return false;

    const permissions = {
      'view': ['view'],
      'comment': ['view', 'comment'],
      'edit': ['view', 'comment', 'edit'],
      'admin': ['view', 'comment', 'edit', 'admin']
    };

    return permissions[participant.permissions]?.includes(permission) || false;
  }, [state.currentUser, state.participants]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.socket) {
        state.socket.disconnect();
      }
    };
  }, [state.socket]);

  const value = {
    // State
    ...state,
    
    // Actions
    initializeSocket,
    joinSession,
    leaveSession,
    sendOperation,
    updateCursor,
    updateSelection,
    requestLock,
    releaseLock,
    addComment,
    updateAwareness,
    
    // Utilities
    getUserById,
    hasPermission,
    
    // UI Actions
    toggleParticipants: () => dispatch({ type: COLLABORATION_ACTIONS.TOGGLE_PARTICIPANTS }),
    toggleComments: () => dispatch({ type: COLLABORATION_ACTIONS.TOGGLE_COMMENTS }),
    setCurrentUser: (user) => dispatch({ type: COLLABORATION_ACTIONS.SET_CURRENT_USER, payload: user }),
    clearError: (key) => dispatch({ type: COLLABORATION_ACTIONS.CLEAR_ERROR, payload: key })
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
};

// Custom hook to use collaboration context
export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};

export default CollaborationContext;