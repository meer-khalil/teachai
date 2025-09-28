import React from 'react';
import './ContentHeader.css';

const ContentHeader = ({
  title,
  onTitleChange,
  onSave,
  onPublish,
  onPreviewToggle,
  onPreviewModeChange,
  saveButtonText = 'Save',
  isSaving = false,
  isDirty = false,
  showUnsavedChanges = false,
  lastSaveText = null,
  showPreview = false,
  previewMode = 'desktop',
  mode = 'edit'
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.target.blur();
    }
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onSave();
    }
  };

  return (
    <header className="content-header">
      <div className="header-left">
        {/* Title Input */}
        <div className="title-section">
          <input
            type="text"
            value={title}
            onChange={onTitleChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter title..."
            className={`title-input ${showUnsavedChanges ? 'unsaved' : ''}`}
            disabled={mode === 'view'}
            maxLength={200}
          />
          
          {/* Save Status */}
          <div className="save-status">
            {showUnsavedChanges && (
              <span className="unsaved-indicator">
                <span className="unsaved-dot">●</span>
                Unsaved changes
              </span>
            )}
            {lastSaveText && !showUnsavedChanges && (
              <span className="last-save">{lastSaveText}</span>
            )}
          </div>
        </div>
      </div>

      <div className="header-center">
        {/* Preview Mode Selector */}
        {showPreview && (
          <div className="preview-mode-selector">
            <button
              className={`mode-button ${previewMode === 'mobile' ? 'active' : ''}`}
              onClick={() => onPreviewModeChange('mobile')}
              title="Mobile Preview"
            >
              <span className="icon">📱</span>
            </button>
            <button
              className={`mode-button ${previewMode === 'tablet' ? 'active' : ''}`}
              onClick={() => onPreviewModeChange('tablet')}
              title="Tablet Preview"
            >
              <span className="icon">📟</span>
            </button>
            <button
              className={`mode-button ${previewMode === 'desktop' ? 'active' : ''}`}
              onClick={() => onPreviewModeChange('desktop')}
              title="Desktop Preview"
            >
              <span className="icon">🖥️</span>
            </button>
          </div>
        )}
      </div>

      <div className="header-right">
        <div className="header-actions">
          {/* Preview Toggle */}
          <button
            className={`action-button preview-button ${showPreview ? 'active' : ''}`}
            onClick={onPreviewToggle}
            title={showPreview ? 'Hide Preview' : 'Show Preview'}
            disabled={mode === 'view'}
          >
            <span className="button-icon">👁️</span>
            <span className="button-text">{showPreview ? 'Hide Preview' : 'Preview'}</span>
          </button>

          {/* Save Button */}
          {mode !== 'view' && (
            <button
              className={`action-button save-button ${isDirty ? 'has-changes' : 'saved'}`}
              onClick={onSave}
              disabled={isSaving || !title.trim()}
              title="Save content (Ctrl+S)"
            >
              {isSaving ? (
                <>
                  <span className="button-spinner"></span>
                  <span className="button-text">Saving...</span>
                </>
              ) : (
                <>
                  <span className="button-icon">{isDirty ? '💾' : '✅'}</span>
                  <span className="button-text">{saveButtonText}</span>
                </>
              )}
            </button>
          )}

          {/* Publish Button */}
          {mode !== 'view' && (
            <button
              className="action-button publish-button primary"
              onClick={onPublish}
              disabled={!title.trim() || isSaving}
              title="Publish content"
            >
              <span className="button-icon">🚀</span>
              <span className="button-text">Publish</span>
            </button>
          )}

          {/* More Actions Dropdown */}
          <div className="dropdown">
            <button className="action-button dropdown-button" title="More actions">
              <span className="button-icon">⋯</span>
            </button>
            
            <div className="dropdown-menu">
              <button className="dropdown-item">
                <span className="item-icon">📋</span>
                Copy Link
              </button>
              <button className="dropdown-item">
                <span className="item-icon">📤</span>
                Export
              </button>
              <button className="dropdown-item">
                <span className="item-icon">📊</span>
                Analytics
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item">
                <span className="item-icon">🗑️</span>
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ContentHeader;