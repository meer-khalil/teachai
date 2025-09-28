import React, { useState, useContext, useEffect } from 'react';
import { SearchContext } from '../../contexts/SearchContext';
import './SavedSearches.css';

const SavedSearches = () => {
  const {
    savedSearches,
    loadSavedSearches,
    saveCurrentSearch,
    deleteSavedSearch,
    loadSavedSearch,
    searchQuery,
    searchFilters,
    user
  } = useContext(SearchContext);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchDescription, setSearchDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadSavedSearches();
    }
  }, [user, loadSavedSearches]);

  const handleSaveSearch = async () => {
    if (!searchName.trim()) return;
    
    setSaving(true);
    try {
      await saveCurrentSearch(searchName.trim(), searchDescription.trim());
      setSearchName('');
      setSearchDescription('');
      setShowSaveModal(false);
    } catch (error) {
      console.error('Error saving search:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSearch = async (searchId) => {
    try {
      await deleteSavedSearch(searchId);
    } catch (error) {
      console.error('Error deleting search:', error);
    }
  };

  const handleLoadSearch = (search) => {
    loadSavedSearch(search);
  };

  const hasCurrentSearch = searchQuery || Object.keys(searchFilters || {}).length > 0;

  if (!user) {
    return (
      <div className="saved-searches-login">
        <div className="saved-searches-icon">🔖</div>
        <h3>Save Your Searches</h3>
        <p>Log in to save and manage your favorite searches for quick access.</p>
        <button className="login-button">Sign In</button>
      </div>
    );
  }

  return (
    <div className={`saved-searches ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Header */}
      <div className="saved-searches-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="header-content">
          <h3 className="saved-searches-title">
            <span className="title-icon">🔖</span>
            Saved Searches
            {savedSearches.length > 0 && (
              <span className="searches-count">{savedSearches.length}</span>
            )}
          </h3>
          <div className="header-actions">
            {hasCurrentSearch && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSaveModal(true);
                }}
                className="save-current-button"
                title="Save current search"
              >
                <span className="button-icon">💾</span>
                Save
              </button>
            )}
            <button className="expand-toggle" aria-label={isExpanded ? 'Collapse' : 'Expand'}>
              <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="saved-searches-content">
        {savedSearches.length === 0 ? (
          <div className="saved-searches-empty">
            <div className="empty-icon">🔍</div>
            <h4>No Saved Searches</h4>
            <p>Save your frequent searches for quick access later.</p>
            {hasCurrentSearch && (
              <button
                onClick={() => setShowSaveModal(true)}
                className="save-first-button"
              >
                Save Current Search
              </button>
            )}
          </div>
        ) : (
          <div className="saved-searches-list">
            {savedSearches.map((search) => (
              <div key={search.id} className="saved-search-item">
                <div className="search-info" onClick={() => handleLoadSearch(search)}>
                  <div className="search-primary">
                    <h4 className="search-name">{search.name}</h4>
                    <div className="search-metadata">
                      <span className="search-query">"{search.searchQuery}"</span>
                      <span className="search-date">
                        {new Date(search.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {search.description && (
                    <p className="search-description">{search.description}</p>
                  )}
                  <div className="search-filters-summary">
                    {Object.entries(search.filters || {}).map(([key, value]) => (
                      <span key={key} className="filter-tag">
                        {key}: {Array.isArray(value) ? value.join(', ') : value}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="search-actions">
                  <button
                    onClick={() => handleLoadSearch(search)}
                    className="load-search-button"
                    title="Load this search"
                  >
                    <span className="action-icon">🔍</span>
                    <span className="action-text">Load</span>
                  </button>
                  <button
                    onClick={() => handleDeleteSearch(search.id)}
                    className="delete-search-button"
                    title="Delete this search"
                  >
                    <span className="action-icon">🗑️</span>
                    <span className="action-text">Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="save-modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="save-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Save Search</h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="modal-close"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="current-search-preview">
                <h4>Current Search:</h4>
                <div className="preview-query">"{searchQuery}"</div>
                {Object.keys(searchFilters || {}).length > 0 && (
                  <div className="preview-filters">
                    {Object.entries(searchFilters).map(([key, value]) => (
                      <span key={key} className="preview-filter-tag">
                        {key}: {Array.isArray(value) ? value.join(', ') : value}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="search-name" className="form-label">
                  Search Name *
                </label>
                <input
                  id="search-name"
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="form-input"
                  placeholder="e.g., React Tutorials"
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="search-description" className="form-label">
                  Description (optional)
                </label>
                <textarea
                  id="search-description"
                  value={searchDescription}
                  onChange={(e) => setSearchDescription(e.target.value)}
                  className="form-textarea"
                  placeholder="Brief description of what this search is for..."
                  rows={3}
                  maxLength={500}
                />
                <div className="character-count">
                  {searchDescription.length}/500 characters
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setShowSaveModal(false)}
                className="modal-button secondary"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSearch}
                className="modal-button primary"
                disabled={!searchName.trim() || saving}
              >
                {saving ? (
                  <>
                    <span className="button-spinner"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="button-icon">💾</span>
                    Save Search
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedSearches;