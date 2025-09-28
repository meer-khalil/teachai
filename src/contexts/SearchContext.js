import React, { createContext, useContext, useState, useCallback } from 'react';
import { debounce } from 'lodash.debounce';

const SearchContext = createContext(null);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [searchResults, setSearchResults] = useState([]);
  const [searchFacets, setSearchFacets] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  
  // UI state
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [resultsPerPage, setResultsPerPage] = useState(20);
  
  // Filters
  const [activeFilters, setActiveFilters] = useState({});
  const [sortBy, setSortBy] = useState('relevance');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Error handling
  const [searchError, setSearchError] = useState(null);
  
  // API base URL
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';

  // Helper function to get auth header
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Search API call
  const performSearch = useCallback(async (options = {}) => {
    const {
      query = searchQuery,
      type = searchType,
      filters = activeFilters,
      sort = sortBy,
      order = sortOrder,
      page = currentPage,
      limit = resultsPerPage,
      facets = true
    } = options;

    setIsSearching(true);
    setSearchError(null);

    try {
      const params = new URLSearchParams({
        q: query,
        type: type === 'all' ? '' : type,
        sort,
        order,
        page: page.toString(),
        limit: limit.toString(),
        facets: facets.toString()
      });

      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`${apiBaseUrl}/search/query?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });

      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data.results);
        setSearchFacets(data.data.facets);
        setTotalResults(data.data.pagination.total);
        setTotalPages(data.data.pagination.totalPages);
        setCurrentPage(data.data.pagination.page);

        // Add to search history if query is not empty
        if (query.trim()) {
          addToSearchHistory(query, type);
        }
      } else {
        throw new Error(data.message || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(error.message);
      setSearchResults([]);
      setSearchFacets({});
      setTotalResults(0);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, searchType, activeFilters, sortBy, sortOrder, currentPage, resultsPerPage, apiBaseUrl]);

  // Debounced search for real-time results
  const debouncedSearch = useCallback(
    debounce((query, options = {}) => {
      if (query.trim().length > 0) {
        performSearch({ query, ...options });
      } else {
        setSearchResults([]);
        setSearchFacets({});
        setTotalResults(0);
      }
    }, 300),
    [performSearch]
  );

  // Get search suggestions
  const getSuggestions = useCallback(async (query, type = 'all', limit = 10) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);

    try {
      const params = new URLSearchParams({
        q: query,
        type: type === 'all' ? '' : type,
        limit: limit.toString()
      });

      const response = await fetch(`${apiBaseUrl}/search/suggest?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.success ? data.data.suggestions : []);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Suggestions error:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [apiBaseUrl]);

  // Debounced suggestions
  const debouncedGetSuggestions = useCallback(
    debounce(getSuggestions, 200),
    [getSuggestions]
  );

  // Advanced search
  const performAdvancedSearch = useCallback(async (searchConfig) => {
    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/search/advanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(searchConfig)
      });

      if (!response.ok) {
        throw new Error('Advanced search request failed');
      }

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data.results);
        setTotalResults(data.data.pagination.total);
        setTotalPages(data.data.pagination.totalPages);
        setCurrentPage(data.data.pagination.page);
      } else {
        throw new Error(data.message || 'Advanced search failed');
      }
    } catch (error) {
      console.error('Advanced search error:', error);
      setSearchError(error.message);
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      setIsSearching(false);
    }
  }, [apiBaseUrl]);

  // Get similar content
  const getSimilarContent = useCallback(async (contentId, contentType, limit = 5) => {
    try {
      const response = await fetch(`${apiBaseUrl}/search/similar/${contentType}/${contentId}?limit=${limit}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.success ? data.data.similar : [];
      }
      return [];
    } catch (error) {
      console.error('Similar content error:', error);
      return [];
    }
  }, [apiBaseUrl]);

  // Load saved searches
  const loadSavedSearches = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/search/saved`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSavedSearches(data.success ? data.data.searches : []);
      }
    } catch (error) {
      console.error('Load saved searches error:', error);
    }
  }, [apiBaseUrl]);

  // Save search
  const saveSearch = useCallback(async (name, description = '') => {
    try {
      const searchData = {
        name,
        description,
        query: searchQuery,
        type: searchType,
        filters: activeFilters,
        sort: {
          field: sortBy,
          order: sortOrder
        }
      };

      const response = await fetch(`${apiBaseUrl}/search/saved`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(searchData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSavedSearches(prev => [data.data.search, ...prev]);
          return data.data.search;
        }
      }
      throw new Error('Failed to save search');
    } catch (error) {
      console.error('Save search error:', error);
      throw error;
    }
  }, [searchQuery, searchType, activeFilters, sortBy, sortOrder, apiBaseUrl]);

  // Apply saved search
  const applySavedSearch = useCallback((savedSearch) => {
    setSearchQuery(savedSearch.query);
    setSearchType(savedSearch.type || 'all');
    setActiveFilters(savedSearch.filters || {});
    setSortBy(savedSearch.sort?.field || 'relevance');
    setSortOrder(savedSearch.sort?.order || 'desc');
    setCurrentPage(1);

    // Perform the search
    performSearch({
      query: savedSearch.query,
      type: savedSearch.type || 'all',
      filters: savedSearch.filters || {},
      sort: savedSearch.sort?.field || 'relevance',
      order: savedSearch.sort?.order || 'desc',
      page: 1
    });
  }, [performSearch]);

  // Search history management
  const addToSearchHistory = useCallback((query, type) => {
    const historyItem = {
      query,
      type,
      timestamp: Date.now()
    };

    setSearchHistory(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(item => 
        !(item.query === query && item.type === type)
      );
      // Add to beginning and limit to 50 items
      return [historyItem, ...filtered].slice(0, 50);
    });

    // Save to localStorage
    try {
      const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      const updated = [historyItem, ...history.filter(item => 
        !(item.query === query && item.type === type)
      )].slice(0, 50);
      localStorage.setItem('searchHistory', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }, []);

  // Load search history from localStorage
  const loadSearchHistory = useCallback(() => {
    try {
      const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      setSearchHistory(history);
    } catch (error) {
      console.error('Error loading search history:', error);
      setSearchHistory([]);
    }
  }, []);

  // Clear search history
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  }, []);

  // Filter management
  const addFilter = useCallback((key, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const removeFilter = useCallback((key) => {
    setActiveFilters(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    setCurrentPage(1);
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters({});
    setCurrentPage(1);
  }, []);

  // Search management
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchFacets({});
    setTotalResults(0);
    setTotalPages(0);
    setCurrentPage(1);
    setSuggestions([]);
    setSearchError(null);
    clearAllFilters();
  }, [clearAllFilters]);

  const contextValue = {
    // Search state
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    searchResults,
    searchFacets,
    suggestions,
    savedSearches,
    setSavedSearches,
    
    // UI state
    isSearching,
    isLoadingSuggestions,
    showAdvancedSearch,
    setShowAdvancedSearch,
    searchHistory,
    searchError,
    
    // Pagination
    currentPage,
    setCurrentPage,
    totalResults,
    totalPages,
    resultsPerPage,
    setResultsPerPage,
    
    // Filters and sorting
    activeFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    
    // Search actions
    performSearch,
    debouncedSearch,
    getSuggestions: debouncedGetSuggestions,
    performAdvancedSearch,
    getSimilarContent,
    
    // Saved searches
    loadSavedSearches,
    saveSearch,
    applySavedSearch,
    
    // Search history
    loadSearchHistory,
    clearSearchHistory,
    
    // Filter management
    addFilter,
    removeFilter,
    clearAllFilters,
    
    // Utility
    clearSearch
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
};

export default SearchContext;