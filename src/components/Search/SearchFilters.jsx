import React, { useState, useEffect } from 'react';
import { useSearch } from '../../contexts/SearchContext';
import './SearchFilters.css';

const SearchFilters = ({ facets = {} }) => {
  const {
    activeFilters,
    searchType,
    addFilter,
    removeFilter,
    clearAllFilters,
    performSearch
  } = useSearch();

  const [expandedSections, setExpandedSections] = useState({
    types: true,
    categories: true,
    difficulty: true,
    dateRange: false,
    rating: false,
    price: false,
    authors: false,
    tags: false
  });

  const [customFilters, setCustomFilters] = useState({
    dateFrom: '',
    dateTo: '',
    minRating: '',
    maxRating: '',
    minPrice: '',
    maxPrice: ''
  });

  // Update custom filters when active filters change
  useEffect(() => {
    setCustomFilters({
      dateFrom: activeFilters.dateFrom || '',
      dateTo: activeFilters.dateTo || '',
      minRating: activeFilters.minRating || '',
      maxRating: activeFilters.maxRating || '',
      minPrice: activeFilters.minPrice || '',
      maxPrice: activeFilters.maxPrice || ''
    });
  }, [activeFilters]);

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle filter selection
  const handleFilterToggle = (key, value) => {
    const currentValues = activeFilters[key] || [];
    
    if (Array.isArray(currentValues)) {
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      if (newValues.length > 0) {
        addFilter(key, newValues);
      } else {
        removeFilter(key);
      }
    } else {
      if (currentValues === value) {
        removeFilter(key);
      } else {
        addFilter(key, value);
      }
    }
  };

  // Handle range filter changes
  const handleRangeFilter = (key, value) => {
    setCustomFilters(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Apply filter with debounce
    clearTimeout(window.rangeFilterTimeout);
    window.rangeFilterTimeout = setTimeout(() => {
      if (value.trim()) {
        addFilter(key, value);
      } else {
        removeFilter(key);
      }
    }, 500);
  };

  // Handle date range filters
  const handleDateRangeApply = () => {
    if (customFilters.dateFrom) {
      addFilter('dateFrom', customFilters.dateFrom);
    } else {
      removeFilter('dateFrom');
    }
    
    if (customFilters.dateTo) {
      addFilter('dateTo', customFilters.dateTo);
    } else {
      removeFilter('dateTo');
    }
  };

  // Handle rating range filters
  const handleRatingRangeApply = () => {
    if (customFilters.minRating) {
      addFilter('minRating', parseFloat(customFilters.minRating));
    } else {
      removeFilter('minRating');
    }
    
    if (customFilters.maxRating) {
      addFilter('maxRating', parseFloat(customFilters.maxRating));
    } else {
      removeFilter('maxRating');
    }
  };

  // Handle price range filters
  const handlePriceRangeApply = () => {
    if (customFilters.minPrice) {
      addFilter('minPrice', parseFloat(customFilters.minPrice));
    } else {
      removeFilter('minPrice');
    }
    
    if (customFilters.maxPrice) {
      addFilter('maxPrice', parseFloat(customFilters.maxPrice));
    } else {
      removeFilter('maxPrice');
    }
  };

  // Get active filter count for a key
  const getActiveFilterCount = (key) => {
    const values = activeFilters[key];
    if (Array.isArray(values)) {
      return values.length;
    }
    return values ? 1 : 0;
  };

  // Check if filter value is active
  const isFilterActive = (key, value) => {
    const currentValues = activeFilters[key] || [];
    if (Array.isArray(currentValues)) {
      return currentValues.includes(value);
    }
    return currentValues === value;
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className="search-filters">
      <div className="filters-header">
        <h3>Filters</h3>
        {hasActiveFilters && (
          <button
            className="clear-all-btn"
            onClick={clearAllFilters}
            title="Clear all filters"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Content Types Filter */}
      {facets.types && facets.types.length > 0 && (
        <div className="filter-section">
          <button
            className="section-header"
            onClick={() => toggleSection('types')}
          >
            <span>Content Type</span>
            <svg 
              className={`expand-icon ${expandedSections.types ? 'expanded' : ''}`}
              width="16" 
              height="16" 
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
          
          {expandedSections.types && (
            <div className="filter-options">
              {facets.types.map(type => (
                <label key={type.key} className="filter-option">
                  <input
                    type="checkbox"
                    checked={searchType === type.key}
                    onChange={() => handleFilterToggle('type', type.key)}
                  />
                  <span className="filter-label">
                    {type.key.charAt(0).toUpperCase() + type.key.slice(1)}
                  </span>
                  <span className="filter-count">({type.count})</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Categories Filter */}
      {(facets.categories || facets.story_categories || facets.course_categories) && (
        <div className="filter-section">
          <button
            className="section-header"
            onClick={() => toggleSection('categories')}
          >
            <span>
              Categories
              {getActiveFilterCount('categories') > 0 && (
                <span className="active-count">({getActiveFilterCount('categories')})</span>
              )}
            </span>
            <svg 
              className={`expand-icon ${expandedSections.categories ? 'expanded' : ''}`}
              width="16" 
              height="16" 
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
          
          {expandedSections.categories && (
            <div className="filter-options">
              {(facets.categories || facets.story_categories || facets.course_categories || [])
                .slice(0, 10)
                .map(category => (
                <label key={category.key} className="filter-option">
                  <input
                    type="checkbox"
                    checked={isFilterActive('categories', category.key)}
                    onChange={() => handleFilterToggle('categories', category.key)}
                  />
                  <span className="filter-label">{category.key}</span>
                  <span className="filter-count">({category.count})</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Difficulty Filter */}
      {facets.difficulty && facets.difficulty.length > 0 && (
        <div className="filter-section">
          <button
            className="section-header"
            onClick={() => toggleSection('difficulty')}
          >
            <span>
              Difficulty
              {getActiveFilterCount('difficulty') > 0 && (
                <span className="active-count">({getActiveFilterCount('difficulty')})</span>
              )}
            </span>
            <svg 
              className={`expand-icon ${expandedSections.difficulty ? 'expanded' : ''}`}
              width="16" 
              height="16" 
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
          
          {expandedSections.difficulty && (
            <div className="filter-options">
              {facets.difficulty.map(difficulty => (
                <label key={difficulty.key} className="filter-option">
                  <input
                    type="checkbox"
                    checked={isFilterActive('difficulty', difficulty.key)}
                    onChange={() => handleFilterToggle('difficulty', difficulty.key)}
                  />
                  <span className={`filter-label difficulty-${difficulty.key.toLowerCase()}`}>
                    {difficulty.key}
                  </span>
                  <span className="filter-count">({difficulty.count})</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Date Range Filter */}
      <div className="filter-section">
        <button
          className="section-header"
          onClick={() => toggleSection('dateRange')}
        >
          <span>
            Date Range
            {(activeFilters.dateFrom || activeFilters.dateTo) && (
              <span className="active-count">(active)</span>
            )}
          </span>
          <svg 
            className={`expand-icon ${expandedSections.dateRange ? 'expanded' : ''}`}
            width="16" 
            height="16" 
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </button>
        
        {expandedSections.dateRange && (
          <div className="filter-options range-filters">
            <div className="date-range">
              <label>From:</label>
              <input
                type="date"
                value={customFilters.dateFrom}
                onChange={(e) => setCustomFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="date-input"
              />
            </div>
            <div className="date-range">
              <label>To:</label>
              <input
                type="date"
                value={customFilters.dateTo}
                onChange={(e) => setCustomFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="date-input"
              />
            </div>
            <button
              className="apply-range-btn"
              onClick={handleDateRangeApply}
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Rating Filter */}
      <div className="filter-section">
        <button
          className="section-header"
          onClick={() => toggleSection('rating')}
        >
          <span>
            Rating
            {(activeFilters.minRating || activeFilters.maxRating) && (
              <span className="active-count">(active)</span>
            )}
          </span>
          <svg 
            className={`expand-icon ${expandedSections.rating ? 'expanded' : ''}`}
            width="16" 
            height="16" 
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </button>
        
        {expandedSections.rating && (
          <div className="filter-options range-filters">
            <div className="rating-range">
              <label>Min Rating:</label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={customFilters.minRating}
                onChange={(e) => setCustomFilters(prev => ({ ...prev, minRating: e.target.value }))}
                className="number-input"
                placeholder="0.0"
              />
            </div>
            <div className="rating-range">
              <label>Max Rating:</label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={customFilters.maxRating}
                onChange={(e) => setCustomFilters(prev => ({ ...prev, maxRating: e.target.value }))}
                className="number-input"
                placeholder="5.0"
              />
            </div>
            <button
              className="apply-range-btn"
              onClick={handleRatingRangeApply}
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Price Filter */}
      {facets.price_ranges && (
        <div className="filter-section">
          <button
            className="section-header"
            onClick={() => toggleSection('price')}
          >
            <span>
              Price
              {(activeFilters.minPrice || activeFilters.maxPrice) && (
                <span className="active-count">(active)</span>
              )}
            </span>
            <svg 
              className={`expand-icon ${expandedSections.price ? 'expanded' : ''}`}
              width="16" 
              height="16" 
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
          
          {expandedSections.price && (
            <div className="filter-options">
              {/* Predefined price ranges */}
              {facets.price_ranges.map(range => (
                <label key={range.key} className="filter-option">
                  <input
                    type="checkbox"
                    checked={isFilterActive('priceRange', range.key)}
                    onChange={() => handleFilterToggle('priceRange', range.key)}
                  />
                  <span className="filter-label">{range.key}</span>
                  <span className="filter-count">({range.count})</span>
                </label>
              ))}
              
              {/* Custom price range */}
              <div className="custom-price-range">
                <div className="price-inputs">
                  <input
                    type="number"
                    min="0"
                    value={customFilters.minPrice}
                    onChange={(e) => setCustomFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                    className="number-input"
                    placeholder="Min $"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    min="0"
                    value={customFilters.maxPrice}
                    onChange={(e) => setCustomFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                    className="number-input"
                    placeholder="Max $"
                  />
                </div>
                <button
                  className="apply-range-btn"
                  onClick={handlePriceRangeApply}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Authors Filter */}
      {facets.authors && facets.authors.length > 0 && (
        <div className="filter-section">
          <button
            className="section-header"
            onClick={() => toggleSection('authors')}
          >
            <span>
              Authors
              {getActiveFilterCount('authors') > 0 && (
                <span className="active-count">({getActiveFilterCount('authors')})</span>
              )}
            </span>
            <svg 
              className={`expand-icon ${expandedSections.authors ? 'expanded' : ''}`}
              width="16" 
              height="16" 
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
          
          {expandedSections.authors && (
            <div className="filter-options">
              {facets.authors.slice(0, 8).map(author => (
                <label key={author.key} className="filter-option">
                  <input
                    type="checkbox"
                    checked={isFilterActive('authors', author.key)}
                    onChange={() => handleFilterToggle('authors', author.key)}
                  />
                  <span className="filter-label">{author.key}</span>
                  <span className="filter-count">({author.count})</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tags Filter */}
      {(facets.tags || facets.story_tags) && (
        <div className="filter-section">
          <button
            className="section-header"
            onClick={() => toggleSection('tags')}
          >
            <span>
              Tags
              {getActiveFilterCount('tags') > 0 && (
                <span className="active-count">({getActiveFilterCount('tags')})</span>
              )}
            </span>
            <svg 
              className={`expand-icon ${expandedSections.tags ? 'expanded' : ''}`}
              width="16" 
              height="16" 
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
          
          {expandedSections.tags && (
            <div className="filter-options tag-options">
              {(facets.tags || facets.story_tags || [])
                .slice(0, 12)
                .map(tag => (
                <label key={tag.key} className="filter-option tag-option">
                  <input
                    type="checkbox"
                    checked={isFilterActive('tags', tag.key)}
                    onChange={() => handleFilterToggle('tags', tag.key)}
                  />
                  <span className="filter-label tag-label">
                    #{tag.key}
                  </span>
                  <span className="filter-count">({tag.count})</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Filters */}
      <div className="filter-section quick-filters">
        <h4 className="quick-filters-title">Quick Filters</h4>
        <div className="quick-filter-buttons">
          <button
            className={`quick-filter-btn ${isFilterActive('status', 'published') ? 'active' : ''}`}
            onClick={() => handleFilterToggle('status', 'published')}
          >
            Published Only
          </button>
          <button
            className={`quick-filter-btn ${isFilterActive('price', 0) ? 'active' : ''}`}
            onClick={() => handleFilterToggle('price', 0)}
          >
            Free Content
          </button>
          <button
            className={`quick-filter-btn ${isFilterActive('featured', true) ? 'active' : ''}`}
            onClick={() => handleFilterToggle('featured', true)}
          >
            Featured
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;