import React, { useState, useEffect } from 'react';
import { useContent } from '../../contexts/ContentContext';
import RichTextEditor from './RichTextEditor';
import ContentSidebar from './ContentSidebar';
import ContentHeader from './ContentHeader';
import ContentVersions from './ContentVersions';
import ContentSEO from './ContentSEO';
import ContentSettings from './ContentSettings';
import ContentPreview from './ContentPreview';
import './ContentEditor.css';

const ContentEditor = ({ 
  contentId = null, 
  template = null, 
  initialData = null,
  mode = 'create' // create, edit, view
}) => {
  const {
    content,
    editorContent,
    editorFormat,
    isDirty,
    isSaving,
    showPreview,
    previewMode,
    sidebarCollapsed,
    activeTab,
    publishSettings,
    seoData,
    versions,
    loading,
    errors,
    
    // Actions
    createContent,
    updateContent,
    publishContent,
    setEditorContent,
    setEditorFormat,
    togglePreview,
    setPreviewMode,
    toggleSidebar,
    setActiveTab,
    updatePublishSetting,
    updateSeoField,
    getContentVersions,
    autoSave
  } = useContent();

  const [localTitle, setLocalTitle] = useState('');
  const [showUnsavedChanges, setShowUnsavedChanges] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);

  // Initialize content
  useEffect(() => {
    if (contentId && mode !== 'create') {
      // Load existing content
      fetchContent(contentId);
    } else if (template) {
      // Initialize with template
      initializeFromTemplate(template);
    } else if (initialData) {
      // Initialize with provided data
      initializeContent(initialData);
    }
  }, [contentId, template, initialData, mode]);

  // Auto-save effect
  useEffect(() => {
    if (isDirty && content && mode !== 'view') {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [isDirty, editorContent, localTitle]);

  // Track unsaved changes
  useEffect(() => {
    setShowUnsavedChanges(isDirty);
  }, [isDirty]);

  const fetchContent = async (id) => {
    try {
      const response = await fetch(`/api/v1/content/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLocalTitle(data.data.content.title || '');
        // Content will be set via ContentContext
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  const initializeFromTemplate = (templateData) => {
    setLocalTitle('Untitled Content');
    updatePublishSetting('contentType', templateData.category);
    setEditorContent(templateData.template || '');
  };

  const initializeContent = (data) => {
    setLocalTitle(data.title || 'Untitled Content');
    setEditorContent(data.content || '');
    Object.keys(data.publishSettings || {}).forEach(key => {
      updatePublishSetting(key, data.publishSettings[key]);
    });
    Object.keys(data.seoData || {}).forEach(key => {
      updateSeoField(key, data.seoData[key]);
    });
  };

  const handleAutoSave = async () => {
    if (content && editorContent && !isSaving) {
      try {
        await autoSave();
        setLastSaveTime(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  };

  const handleManualSave = async () => {
    if (!localTitle.trim()) {
      alert('Please enter a title');
      return;
    }

    try {
      const contentData = {
        title: localTitle,
        content: editorContent,
        format: editorFormat,
        ...publishSettings,
        seo: seoData
      };

      if (mode === 'create') {
        await createContent(contentData);
      } else {
        await updateContent(content._id, contentData);
      }
      
      setLastSaveTime(new Date());
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handlePublish = async () => {
    if (!content) {
      await handleManualSave();
    }
    
    try {
      await publishContent(content._id);
    } catch (error) {
      console.error('Publish failed:', error);
    }
  };

  const handleTitleChange = (e) => {
    setLocalTitle(e.target.value);
  };

  const handleEditorChange = (newContent) => {
    setEditorContent(newContent);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handlePreviewToggle = () => {
    togglePreview();
  };

  const handlePreviewModeChange = (mode) => {
    setPreviewMode(mode);
  };

  const getSaveButtonText = () => {
    if (isSaving) return 'Saving...';
    if (isDirty) return 'Save Changes';
    return 'Saved';
  };

  const getLastSaveText = () => {
    if (!lastSaveTime) return null;
    const now = new Date();
    const diff = Math.floor((now - lastSaveTime) / 1000);
    
    if (diff < 60) return `Saved ${diff}s ago`;
    if (diff < 3600) return `Saved ${Math.floor(diff / 60)}m ago`;
    return `Saved ${Math.floor(diff / 3600)}h ago`;
  };

  const editorClasses = [
    'content-editor',
    showPreview ? 'split-view' : 'full-editor',
    sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded',
    mode
  ].join(' ');

  if (loading.content) {
    return (
      <div className="content-editor-loading">
        <div className="loading-spinner"></div>
        <p>Loading content...</p>
      </div>
    );
  }

  return (
    <div className={editorClasses}>
      {/* Header */}
      <ContentHeader
        title={localTitle}
        onTitleChange={handleTitleChange}
        onSave={handleManualSave}
        onPublish={handlePublish}
        onPreviewToggle={handlePreviewToggle}
        onPreviewModeChange={handlePreviewModeChange}
        saveButtonText={getSaveButtonText()}
        isSaving={isSaving}
        isDirty={isDirty}
        showUnsavedChanges={showUnsavedChanges}
        lastSaveText={getLastSaveText()}
        showPreview={showPreview}
        previewMode={previewMode}
        mode={mode}
      />

      {/* Main Content Area */}
      <div className="content-editor-body">
        {/* Sidebar */}
        <ContentSidebar
          collapsed={sidebarCollapsed}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onToggle={toggleSidebar}
        />

        {/* Editor Area */}
        <div className="content-editor-main">
          {!showPreview ? (
            <div className="editor-container">
              {/* Tab Content */}
              <div className="editor-tabs">
                {activeTab === 'content' && (
                  <div className="tab-content active">
                    <RichTextEditor
                      value={editorContent}
                      onChange={handleEditorChange}
                      format={editorFormat}
                      placeholder="Start writing your content..."
                      readOnly={mode === 'view'}
                      height={600}
                      autoSave={true}
                      onAutoSave={handleAutoSave}
                      features={{
                        wordCount: true,
                        characterCount: true,
                        readingTime: true,
                        spellCheck: true,
                        autoComplete: true,
                        codeView: true,
                        fullScreen: true,
                        tables: true,
                        media: true,
                        links: true,
                        mentions: true
                      }}
                    />
                  </div>
                )}

                {activeTab === 'seo' && (
                  <div className="tab-content active">
                    <ContentSEO />
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="tab-content active">
                    <ContentSettings />
                  </div>
                )}

                {activeTab === 'versions' && (
                  <div className="tab-content active">
                    <ContentVersions contentId={content?._id} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="preview-split">
              <div className="editor-half">
                <div className="editor-header-small">
                  <h3>Editor</h3>
                </div>
                <RichTextEditor
                  value={editorContent}
                  onChange={handleEditorChange}
                  format={editorFormat}
                  readOnly={mode === 'view'}
                  height={500}
                  toolbar="basic"
                />
              </div>
              
              <div className="preview-half">
                <ContentPreview
                  content={{
                    title: localTitle,
                    content: editorContent,
                    ...publishSettings,
                    seo: seoData
                  }}
                  mode={previewMode}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Messages */}
      {Object.entries(errors).map(([key, error]) => 
        error && (
          <div key={key} className="error-toast">
            <div className="error-content">
              <span className="error-icon">⚠️</span>
              <span className="error-message">{error}</span>
              <button 
                className="error-close"
                onClick={() => dispatch({ type: 'CLEAR_ERROR', key })}
              >
                ✕
              </button>
            </div>
          </div>
        )
      )}

      {/* Unsaved Changes Warning */}
      {showUnsavedChanges && (
        <div className="unsaved-changes-indicator">
          <span className="unsaved-icon">●</span>
          <span className="unsaved-text">Unsaved changes</span>
        </div>
      )}
    </div>
  );
};

export default ContentEditor;