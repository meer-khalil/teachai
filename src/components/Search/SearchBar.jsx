import React, { useState, useRef, useEffect } from 'react';
import { useSearch } from '../../contexts/SearchContext';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css';

const SearchBar = ({
  placeholder = "Search...",
  showTypeSelector = true,
  showAdvancedToggle = false,
  onSearch,
  className = ''
}) => {
  const {
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    suggestions,
    isLoadingSuggestions,
    searchHistory,
    setShowAdvancedSearch,
    getSuggestions,
    performSearch
  } = useSearch();

  const [focused, setFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [localQuery, setLocalQuery] = useState(searchQuery);

  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const navigate = useNavigate();

  // Content type options
  const contentTypes = [
    { value: 'all', label: 'All Content', icon: '🌐' },
    { value: 'posts', label: 'Posts', icon: '📝' },
    { value: 'stories', label: 'Stories', icon: '📖' },
    { value: 'courses', label: 'Courses', icon: '🎓' },
    { value: 'users', label: 'Users', icon: '👥' },
    { value: 'comments', label: 'Comments', icon: '💬' }
  ];

  const currentType = contentTypes.find(type => type.value === searchType) || contentTypes[0];

  // Update local query when search query changes
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setLocalQuery(value);
    setSearchQuery(value);
    setSelectedSuggestionIndex(-1);

    // Get suggestions if query is long enough
    if (value.trim().length >= 2) {
      getSuggestions(value.trim(), searchType);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle search submit
  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(localQuery.trim());
  };

  // Handle search execution
  const handleSearch = (query) => {
    if (query.trim()) {
      setShowSuggestions(false);
      setFocused(false);
      inputRef.current?.blur();

      if (onSearch) {
        onSearch(query, searchType);
      } else {
        performSearch({ query, type: searchType });
        // Navigate to search page if not already there
        if (window.location.pathname !== '/search') {
          navigate(`/search?q=${encodeURIComponent(query)}&type=${searchType}`);
        }
      }
    }
  };

  // Handle input focus
  const handleFocus = () => {
    setFocused(true);
    if (localQuery.trim().length >= 2 || searchHistory.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle input blur
  const handleBlur = () => {
    // Delay to allow suggestion clicks
    setTimeout(() => {
      setFocused(false);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 200);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    const suggestionsList = getSuggestionsList();
    const maxIndex = suggestionsList.length - 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < maxIndex ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : maxIndex
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex <= maxIndex) {
          const selected = suggestionsList[selectedSuggestionIndex];
          handleSearch(selected.text || selected.query);
        } else {
          handleSearch(localQuery.trim());
        }
        break;

      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        inputRef.current?.blur();
        break;

      default:
        break;
    }
  };

  // Get combined suggestions list
  const getSuggestionsList = () => {
    const list = [];

    // Add search suggestions
    if (suggestions.length > 0) {
      list.push(...suggestions.map(s => ({ ...s, type: 'suggestion' })));
    }

    // Add recent searches if no query or no suggestions
    if (localQuery.trim().length < 2 && searchHistory.length > 0) {
      list.push(...searchHistory.slice(0, 5).map(h => ({ 
        ...h, 
        type: 'history',
        text: h.query 
      })));
    }

    return list.slice(0, 8); // Limit to 8 suggestions
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    const query = suggestion.text || suggestion.query;
    setLocalQuery(query);
    setSearchQuery(query);
    handleSearch(query);
  };

  // Handle type change
  const handleTypeChange = (newType) => {
    setSearchType(newType);
    if (localQuery.trim()) {
      getSuggestions(localQuery.trim(), newType);
    }
  };

  // Handle clear
  const handleClear = () => {
    setLocalQuery('');
    setSearchQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Handle voice search (if supported)
  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setLocalQuery(transcript);
        setSearchQuery(transcript);
        handleSearch(transcript);
      };

      recognition.start();
    }
  };

  const suggestionsList = getSuggestionsList();
  const hasVoiceSupport = 'webkitSpeechRecognition' in window;

  return (
    <div className={`search-bar ${focused ? 'focused' : ''} ${className}`}>
      <form onSubmit={handleSubmit} className="search-form">
        {/* Type Selector */}
        {showTypeSelector && (
          <div className="type-selector">
            <button
              type="button"
              className="type-button"
              onClick={() => {
                // Toggle dropdown (implement if needed)
              }}
              title={`Search in: ${currentType.label}`}
            >
              <span className="type-icon">{currentType.icon}</span>
              <span className="type-label">{currentType.label}</span>
              <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24">
                <path d="M7 10l5 5 5-5z" fill="currentColor"/>
              </svg>
            </button>

            {/* Type Dropdown */}
            <div className="type-dropdown">
              {contentTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  className={`type-option ${type.value === searchType ? 'active' : ''}`}
                  onClick={() => handleTypeChange(type.value)}
                >
                  <span className="type-icon">{type.icon}</span>
                  <span className="type-label">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="search-input-container">
          <div className="search-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={localQuery}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="search-input"
              autoComplete="off"
              spellCheck="false"
            />

            {/* Search Icon */}
            <div className="search-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </div>

            {/* Clear Button */}
            {localQuery && (
              <button
                type="button"
                className="clear-button"
                onClick={handleClear}
                title="Clear search"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            )}

            {/* Voice Search Button */}
            {hasVoiceSupport && (
              <button
                type="button"
                className="voice-button"
                onClick={handleVoiceSearch}
                title="Voice search"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                </svg>
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestionsList.length > 0 && (
            <div ref={suggestionsRef} className="suggestions-dropdown">
              {isLoadingSuggestions && (
                <div className="suggestion-loading">
                  <div className="loading-spinner"></div>
                  <span>Getting suggestions...</span>
                </div>
              )}

              {suggestionsList.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${index}`}
                  type="button"
                  className={`suggestion-item ${index === selectedSuggestionIndex ? 'selected' : ''}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="suggestion-icon">
                    {suggestion.type === 'history' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                      </svg>
                    )}
                  </div>
                  
                  <div className="suggestion-content">
                    <div className="suggestion-text">
                      {suggestion.text || suggestion.query}
                    </div>
                    {suggestion.type === 'suggestion' && suggestion.type && (
                      <div className="suggestion-meta">
                        in {suggestion.type}
                      </div>
                    )}
                    {suggestion.type === 'history' && (
                      <div className="suggestion-meta">
                        Recent search
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Button */}
        <button type="submit" className="search-submit">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <span className="sr-only">Search</span>
        </button>

        {/* Advanced Search Toggle */}
        {showAdvancedToggle && (
          <button
            type="button"
            className="advanced-toggle"
            onClick={() => setShowAdvancedSearch(true)}
            title="Advanced search"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
            </svg>
          </button>
        )}
      </form>
    </div>
  );
};

export default SearchBar;