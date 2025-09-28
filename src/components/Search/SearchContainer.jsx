import React, { useState, useEffect } from 'react';
import { useSearch } from '../../contexts/SearchContext';
import SearchBar from './SearchBar';
import SearchFilters from './SearchFilters';
import SearchResults from './SearchResults';
import SearchPagination from './SearchPagination';
import SavedSearches from './SavedSearches';
import './SearchContainer.css';

const SearchContainer = ({ 
  initialQuery = '', 
  initialType = 'all',
  showSavedSearches = true,
  showFilters = true,
  embedded = false 
}) => {
  const {
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    searchResults,
    searchFacets,
    isSearching,
    showAdvancedSearch,
    setShowAdvancedSearch,
    totalResults,
    currentPage,
    totalPages,
    activeFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    performSearch,
    loadSavedSearches,
    clearSearch,
    searchError
  } = useSearch();

  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Initialize search on component mount
  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
      setSearchType(initialType);
      performSearch({ query: initialQuery, type: initialType });
    }
    if (showSavedSearches) {
      loadSavedSearches();
    }
  }, [initialQuery, initialType, showSavedSearches, setSearchQuery, setSearchType, performSearch, loadSavedSearches]);

  // Handle search submission
  const handleSearch = (query, type = searchType) => {
    if (query.trim()) {
      performSearch({ query, type, page: 1 });
    }
  };

  // Handle filter toggle
  const toggleFilters = () => {
    setShowFiltersPanel(!showFiltersPanel);
  };

  // Handle sort change
  const handleSortChange = (field, order = sortOrder) => {
    setSortBy(field);
    setSortOrder(order);
    performSearch({ sort: field, order });
  };

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  // Handle clear search
  const handleClearSearch = () => {
    clearSearch();
    setShowFiltersPanel(false);
  };

  const containerClasses = `search-container ${embedded ? 'embedded' : 'standalone'}`;
  const hasResults = searchResults.length > 0;
  const hasFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className={containerClasses}>
      {/* Search Header */}
      <div className="search-header">
        <div className="search-header-content">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search content, stories, courses..."
            showTypeSelector={true}
            showAdvancedToggle={true}
          />
          
          {/* Search Controls */}
          <div className="search-controls">
            {showFilters && (
              <button
                className={`filter-toggle-btn ${showFiltersPanel ? 'active' : ''}`}
                onClick={toggleFilters}
                title="Toggle Filters"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
                </svg>
                Filters
                {hasFilters && <span className="filter-count">{Object.keys(activeFilters).length}</span>}
              </button>
            )}
            
            {hasResults && (
              <>
                {/* View Mode Toggle */}
                <div className="view-mode-toggle">
                  <button
                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => handleViewModeChange('grid')}
                    title="Grid View"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h-2v2h2v-2zm-2 4h2v2h-2v-2zm2 2h2v2h-2v-2zm0 2h-2v2h2v-2z"/>
                    </svg>
                  </button>
                  <button
                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => handleViewModeChange('list')}
                    title="List View"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                    </svg>
                  </button>
                </div>

                {/* Sort Controls */}
                <div className="sort-controls">
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-');
                      handleSortChange(field, order);
                    }}
                    className="sort-select"
                  >
                    <option value="relevance-desc">Most Relevant</option>
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="title-asc">Title A-Z</option>
                    <option value="title-desc">Title Z-A</option>
                    <option value="views-desc">Most Viewed</option>
                    <option value="rating-desc">Highest Rated</option>
                  </select>
                </div>
              </>
            )}

            {/* Clear Search */}
            {(searchQuery || hasResults || hasFilters) && (
              <button
                className="clear-search-btn"
                onClick={handleClearSearch}
                title="Clear Search"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Results Summary */}
        {hasResults && (
          <div className="search-summary">
            <span className="results-count">
              {totalResults.toLocaleString()} results found
              {searchQuery && (
                <span className="search-query"> for "{searchQuery}"</span>
              )}
            </span>
            {isSearching && <span className="searching-indicator">Searching...</span>}
          </div>
        )}

        {/* Active Filters Display */}
        {hasFilters && (
          <div className="active-filters">
            <span className="filters-label">Active Filters:</span>
            <div className="filter-tags">
              {Object.entries(activeFilters).map(([key, value]) => (
                <div key={key} className="filter-tag">
                  <span className="filter-name">{key}:</span>
                  <span className="filter-value">
                    {Array.isArray(value) ? value.join(', ') : value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="search-main">
        {/* Sidebar with Filters and Saved Searches */}
        {(showFilters || showSavedSearches) && (
          <div className={`search-sidebar ${showFiltersPanel ? 'visible' : ''}`}>
            {showFilters && (
              <div className="sidebar-section">
                <SearchFilters facets={searchFacets} />
              </div>
            )}
            
            {showSavedSearches && (
              <div className="sidebar-section">
                <SavedSearches />
              </div>
            )}
          </div>
        )}

        {/* Results Area */}
        <div className="search-results-area">
          {searchError && (
            <div className="search-error">
              <div className="error-icon">⚠️</div>
              <div className="error-message">
                <h3>Search Error</h3>
                <p>{searchError}</p>
                <button 
                  onClick={() => performSearch()}
                  className="retry-btn"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!searchError && (
            <>
              <SearchResults 
                results={searchResults}
                isLoading={isSearching}
                viewMode={viewMode}
                query={searchQuery}
              />

              {hasResults && totalPages > 1 && (
                <SearchPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalResults={totalResults}
                />
              )}
            </>
          )}

          {/* Empty State */}
          {!isSearching && !searchError && searchResults.length === 0 && searchQuery && (
            <div className="empty-results">
              <div className="empty-icon">🔍</div>
              <h3>No results found</h3>
              <p>Try adjusting your search terms or filters</p>
              <div className="empty-suggestions">
                <p>Suggestions:</p>
                <ul>
                  <li>Check your spelling</li>
                  <li>Try broader search terms</li>
                  <li>Remove some filters</li>
                  <li>Try searching in all content types</li>
                </ul>
              </div>
            </div>
          )}

          {/* Initial State */}
          {!searchQuery && !hasResults && !isSearching && (
            <div className="search-welcome">
              <div className="welcome-icon">🔍</div>
              <h2>Search TeachAI</h2>
              <p>Discover content, stories, courses, and more using our powerful search</p>
              <div className="search-features">
                <div className="feature">
                  <span className="feature-icon">⚡</span>
                  <span>Real-time suggestions</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">🎯</span>
                  <span>Advanced filtering</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">💾</span>
                  <span>Save searches</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Search Modal */}
      {showAdvancedSearch && (
        <div className="modal-overlay" onClick={() => setShowAdvancedSearch(false)}>
          <div className="modal-content advanced-search-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Advanced Search</h2>
              <button 
                className="modal-close"
                onClick={() => setShowAdvancedSearch(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {/* Advanced search form would go here */}
              <p>Advanced search features coming soon...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchContainer;