import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Initial state
const initialState = {
  // Content Management
  content: null,
  contentList: [],
  templates: [],
  
  // Editor State
  editorContent: '',
  editorFormat: 'html', // html, markdown, draft-js
  isDirty: false,
  isSaving: false,
  autoSaveEnabled: true,
  lastSaved: null,
  
  // Versioning
  versions: [],
  currentVersion: 1,
  showVersionHistory: false,
  
  // Workflow
  workflowStep: 'creation',
  approvalStatus: 'none',
  collaborators: [],
  
  // UI State
  showPreview: false,
  previewMode: 'desktop', // desktop, tablet, mobile
  sidebarCollapsed: false,
  activeTab: 'content', // content, seo, settings, versions
  
  // Publishing
  publishSettings: {
    status: 'draft',
    visibility: 'public',
    scheduledPublishAt: null,
    categories: [],
    tags: [],
    featuredImage: null
  },
  
  // SEO
  seoData: {
    metaTitle: '',
    metaDescription: '',
    metaKeywords: [],
    canonicalUrl: '',
    ogImage: '',
    schemaMarkup: null
  },
  
  // Loading states
  loading: {
    content: false,
    templates: false,
    saving: false,
    publishing: false,
    versions: false
  },
  
  // Errors
  errors: {
    content: null,
    saving: null,
    publishing: null
  }
};

// Action types
const actionTypes = {
  // Content actions
  SET_CONTENT: 'SET_CONTENT',
  UPDATE_CONTENT: 'UPDATE_CONTENT',
  SET_CONTENT_LIST: 'SET_CONTENT_LIST',
  SET_TEMPLATES: 'SET_TEMPLATES',
  
  // Editor actions
  SET_EDITOR_CONTENT: 'SET_EDITOR_CONTENT',
  SET_EDITOR_FORMAT: 'SET_EDITOR_FORMAT',
  SET_DIRTY: 'SET_DIRTY',
  SET_SAVING: 'SET_SAVING',
  SET_LAST_SAVED: 'SET_LAST_SAVED',
  
  // Version actions
  SET_VERSIONS: 'SET_VERSIONS',
  SET_CURRENT_VERSION: 'SET_CURRENT_VERSION',
  TOGGLE_VERSION_HISTORY: 'TOGGLE_VERSION_HISTORY',
  
  // Workflow actions
  SET_WORKFLOW_STEP: 'SET_WORKFLOW_STEP',
  SET_APPROVAL_STATUS: 'SET_APPROVAL_STATUS',
  SET_COLLABORATORS: 'SET_COLLABORATORS',
  
  // UI actions
  TOGGLE_PREVIEW: 'TOGGLE_PREVIEW',
  SET_PREVIEW_MODE: 'SET_PREVIEW_MODE',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  
  // Publishing actions
  SET_PUBLISH_SETTINGS: 'SET_PUBLISH_SETTINGS',
  UPDATE_PUBLISH_SETTING: 'UPDATE_PUBLISH_SETTING',
  
  // SEO actions
  SET_SEO_DATA: 'SET_SEO_DATA',
  UPDATE_SEO_FIELD: 'UPDATE_SEO_FIELD',
  
  // Loading actions
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Reset action
  RESET_STATE: 'RESET_STATE'
};

// Reducer
const contentReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_CONTENT:
      return {
        ...state,
        content: action.payload,
        editorContent: action.payload?.content || '',
        publishSettings: {
          ...state.publishSettings,
          ...action.payload?.publishSettings
        },
        seoData: {
          ...state.seoData,
          ...action.payload?.seo
        },
        currentVersion: action.payload?.currentVersion || 1,
        workflowStep: action.payload?.workflow?.currentStep || 'creation',
        collaborators: action.payload?.collaborators || [],
        isDirty: false
      };
      
    case actionTypes.UPDATE_CONTENT:
      return {
        ...state,
        content: {
          ...state.content,
          ...action.payload
        }
      };
      
    case actionTypes.SET_CONTENT_LIST:
      return {
        ...state,
        contentList: action.payload
      };
      
    case actionTypes.SET_TEMPLATES:
      return {
        ...state,
        templates: action.payload
      };
      
    case actionTypes.SET_EDITOR_CONTENT:
      return {
        ...state,
        editorContent: action.payload,
        isDirty: action.payload !== (state.content?.content || '')
      };
      
    case actionTypes.SET_EDITOR_FORMAT:
      return {
        ...state,
        editorFormat: action.payload
      };
      
    case actionTypes.SET_DIRTY:
      return {
        ...state,
        isDirty: action.payload
      };
      
    case actionTypes.SET_SAVING:
      return {
        ...state,
        isSaving: action.payload,
        loading: {
          ...state.loading,
          saving: action.payload
        }
      };
      
    case actionTypes.SET_LAST_SAVED:
      return {
        ...state,
        lastSaved: action.payload,
        isDirty: false
      };
      
    case actionTypes.SET_VERSIONS:
      return {
        ...state,
        versions: action.payload
      };
      
    case actionTypes.SET_CURRENT_VERSION:
      return {
        ...state,
        currentVersion: action.payload
      };
      
    case actionTypes.TOGGLE_VERSION_HISTORY:
      return {
        ...state,
        showVersionHistory: !state.showVersionHistory
      };
      
    case actionTypes.SET_WORKFLOW_STEP:
      return {
        ...state,
        workflowStep: action.payload
      };
      
    case actionTypes.SET_APPROVAL_STATUS:
      return {
        ...state,
        approvalStatus: action.payload
      };
      
    case actionTypes.SET_COLLABORATORS:
      return {
        ...state,
        collaborators: action.payload
      };
      
    case actionTypes.TOGGLE_PREVIEW:
      return {
        ...state,
        showPreview: !state.showPreview
      };
      
    case actionTypes.SET_PREVIEW_MODE:
      return {
        ...state,
        previewMode: action.payload
      };
      
    case actionTypes.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed
      };
      
    case actionTypes.SET_ACTIVE_TAB:
      return {
        ...state,
        activeTab: action.payload
      };
      
    case actionTypes.SET_PUBLISH_SETTINGS:
      return {
        ...state,
        publishSettings: {
          ...state.publishSettings,
          ...action.payload
        }
      };
      
    case actionTypes.UPDATE_PUBLISH_SETTING:
      return {
        ...state,
        publishSettings: {
          ...state.publishSettings,
          [action.field]: action.value
        }
      };
      
    case actionTypes.SET_SEO_DATA:
      return {
        ...state,
        seoData: {
          ...state.seoData,
          ...action.payload
        }
      };
      
    case actionTypes.UPDATE_SEO_FIELD:
      return {
        ...state,
        seoData: {
          ...state.seoData,
          [action.field]: action.value
        }
      };
      
    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.key]: action.value
        }
      };
      
    case actionTypes.SET_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.key]: action.value
        }
      };
      
    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.key]: null
        }
      };
      
    case actionTypes.RESET_STATE:
      return initialState;
      
    default:
      return state;
  }
};

// Context
const ContentContext = createContext();

// Provider component
export const ContentProvider = ({ children }) => {
  const [state, dispatch] = useReducer(contentReducer, initialState);

  // Content API functions
  const createContent = useCallback(async (contentData) => {
    dispatch({ type: actionTypes.SET_LOADING, key: 'content', value: true });
    dispatch({ type: actionTypes.CLEAR_ERROR, key: 'content' });
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(contentData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create content');
      }
      
      const data = await response.json();
      dispatch({ type: actionTypes.SET_CONTENT, payload: data.data.content });
      
      return data.data.content;
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, key: 'content', value: error.message });
      throw error;
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, key: 'content', value: false });
    }
  }, []);

  const updateContent = useCallback(async (contentId, updates, versionComment) => {
    dispatch({ type: actionTypes.SET_SAVING, value: true });
    dispatch({ type: actionTypes.CLEAR_ERROR, key: 'saving' });
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/content/${contentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...updates, versionComment })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update content');
      }
      
      const data = await response.json();
      dispatch({ type: actionTypes.SET_CONTENT, payload: data.data.content });
      dispatch({ type: actionTypes.SET_LAST_SAVED, payload: new Date() });
      
      return data.data.content;
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, key: 'saving', value: error.message });
      throw error;
    } finally {
      dispatch({ type: actionTypes.SET_SAVING, value: false });
    }
  }, []);

  const publishContent = useCallback(async (contentId) => {
    dispatch({ type: actionTypes.SET_LOADING, key: 'publishing', value: true });
    dispatch({ type: actionTypes.CLEAR_ERROR, key: 'publishing' });
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/content/${contentId}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to publish content');
      }
      
      const data = await response.json();
      dispatch({ type: actionTypes.UPDATE_CONTENT, payload: { status: 'published', publishedAt: new Date() } });
      
      return data.data.content;
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, key: 'publishing', value: error.message });
      throw error;
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, key: 'publishing', value: false });
    }
  }, []);

  const getContentVersions = useCallback(async (contentId) => {
    dispatch({ type: actionTypes.SET_LOADING, key: 'versions', value: true });
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/content/${contentId}/versions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch versions');
      }
      
      const data = await response.json();
      dispatch({ type: actionTypes.SET_VERSIONS, payload: data.data.versions });
      dispatch({ type: actionTypes.SET_CURRENT_VERSION, payload: data.data.currentVersion });
      
      return data.data;
    } catch (error) {
      console.error('Error fetching versions:', error);
      throw error;
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, key: 'versions', value: false });
    }
  }, []);

  const revertToVersion = useCallback(async (contentId, versionNumber) => {
    dispatch({ type: actionTypes.SET_LOADING, key: 'versions', value: true });
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/content/${contentId}/versions/${versionNumber}/revert`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to revert to version');
      }
      
      const data = await response.json();
      dispatch({ type: actionTypes.SET_CONTENT, payload: data.data.content });
      
      return data.data.content;
    } catch (error) {
      console.error('Error reverting version:', error);
      throw error;
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, key: 'versions', value: false });
    }
  }, []);

  const getTemplates = useCallback(async () => {
    dispatch({ type: actionTypes.SET_LOADING, key: 'templates', value: true });
    
    try {
      const response = await fetch('/api/v1/content/templates');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch templates');
      }
      
      const data = await response.json();
      dispatch({ type: actionTypes.SET_TEMPLATES, payload: data.data.templates });
      
      return data.data.templates;
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, key: 'templates', value: false });
    }
  }, []);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (state.isDirty && state.content && state.editorContent && state.autoSaveEnabled) {
      try {
        await updateContent(state.content._id, {
          content: state.editorContent
        }, 'Auto-save');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }, [state.isDirty, state.content, state.editorContent, state.autoSaveEnabled, updateContent]);

  // Editor actions
  const setEditorContent = useCallback((content) => {
    dispatch({ type: actionTypes.SET_EDITOR_CONTENT, payload: content });
  }, []);

  const setEditorFormat = useCallback((format) => {
    dispatch({ type: actionTypes.SET_EDITOR_FORMAT, payload: format });
  }, []);

  // UI actions
  const togglePreview = useCallback(() => {
    dispatch({ type: actionTypes.TOGGLE_PREVIEW });
  }, []);

  const setPreviewMode = useCallback((mode) => {
    dispatch({ type: actionTypes.SET_PREVIEW_MODE, payload: mode });
  }, []);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: actionTypes.TOGGLE_SIDEBAR });
  }, []);

  const setActiveTab = useCallback((tab) => {
    dispatch({ type: actionTypes.SET_ACTIVE_TAB, payload: tab });
  }, []);

  const updatePublishSetting = useCallback((field, value) => {
    dispatch({ type: actionTypes.UPDATE_PUBLISH_SETTING, field, value });
  }, []);

  const updateSeoField = useCallback((field, value) => {
    dispatch({ type: actionTypes.UPDATE_SEO_FIELD, field, value });
  }, []);

  // Context value
  const value = {
    // State
    ...state,
    
    // Actions
    createContent,
    updateContent,
    publishContent,
    getContentVersions,
    revertToVersion,
    getTemplates,
    autoSave,
    setEditorContent,
    setEditorFormat,
    togglePreview,
    setPreviewMode,
    toggleSidebar,
    setActiveTab,
    updatePublishSetting,
    updateSeoField,
    
    // Dispatch for custom actions
    dispatch
  };

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
};

// Hook to use the context
export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};

export default ContentContext;