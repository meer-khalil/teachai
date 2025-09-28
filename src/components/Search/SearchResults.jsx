import React from 'react';
import Highlighter from 'react-highlight-words';
import './SearchResults.css';

const SearchResults = ({ 
  results = [], 
  isLoading = false, 
  viewMode = 'grid',
  query = '',
  onResultClick 
}) => {
  
  // Handle result click with analytics tracking
  const handleResultClick = (result, position) => {
    if (onResultClick) {
      onResultClick(result, position);
    }
    
    // Track click analytics (would integrate with analytics service)
    // trackSearchClick(result.id, result.type, position, query);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get result URL based on type
  const getResultUrl = (result) => {
    switch (result.type) {
      case 'posts':
        return `/post/${result.source.slug || result.id}`;
      case 'stories':
        return `/blog/${result.source.slug || result.id}`;
      case 'courses':
        return `/course/${result.source.slug || result.id}`;
      case 'users':
        return `/profile/${result.source.username || result.id}`;
      case 'comments':
        return `/post/${result.source.postId}#comment-${result.id}`;
      default:
        return '#';
    }
  };

  // Get result icon based on type
  const getResultIcon = (type) => {
    const icons = {
      posts: '📝',
      stories: '📖',
      courses: '🎓',
      users: '👤',
      comments: '💬'
    };
    return icons[type] || '📄';
  };

  // Get result type label
  const getTypeLabel = (type) => {
    const labels = {
      posts: 'Post',
      stories: 'Story',
      courses: 'Course',
      users: 'User',
      comments: 'Comment'
    };
    return labels[type] || type;
  };

  // Extract highlight text
  const getHighlightedText = (result, field, fallback) => {
    if (result.highlight && result.highlight[field]) {
      return result.highlight[field].join('...');
    }
    return result.source[field] || fallback;
  };

  if (isLoading) {
    return (
      <div className="search-results loading">
        <div className="loading-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="result-skeleton">
              <div className="skeleton-header">
                <div className="skeleton-icon"></div>
                <div className="skeleton-title"></div>
              </div>
              <div className="skeleton-content">
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
              </div>
              <div className="skeleton-footer">
                <div className="skeleton-meta"></div>
                <div className="skeleton-meta"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return null; // Parent component handles empty state
  }

  return (
    <div className={`search-results ${viewMode}`}>
      <div className={`results-${viewMode}`}>
        {results.map((result, index) => {
          const resultUrl = getResultUrl(result);
          const typeIcon = getResultIcon(result.type);
          const typeLabel = getTypeLabel(result.type);
          
          return (
            <div 
              key={`${result.type}-${result.id}-${index}`}
              className="search-result-item"
              onClick={() => handleResultClick(result, index + 1)}
            >
              <a href={resultUrl} className="result-link">
                {/* Result Header */}
                <div className="result-header">
                  <div className="result-type">
                    <span className="type-icon">{typeIcon}</span>
                    <span className="type-label">{typeLabel}</span>
                  </div>
                  
                  {result.score && (
                    <div className="result-score" title={`Relevance Score: ${result.score.toFixed(2)}`}>
                      {Math.round(result.score * 10) / 10}
                    </div>
                  )}
                </div>

                {/* Result Title */}
                <h3 className="result-title">
                  <Highlighter
                    highlightClassName="search-highlight"
                    searchWords={query.split(' ').filter(word => word.length > 0)}
                    autoEscape={true}
                    textToHighlight={getHighlightedText(result, 'title', result.source.name || result.source.title || 'Untitled')}
                  />
                </h3>

                {/* Result Content/Description */}
                <div className="result-content">
                  <Highlighter
                    highlightClassName="search-highlight"
                    searchWords={query.split(' ').filter(word => word.length > 0)}
                    autoEscape={true}
                    textToHighlight={getHighlightedText(result, 'content', 
                      result.source.description || result.source.excerpt || result.source.content || result.source.bio || 'No description available'
                    ).substring(0, 200) + (getHighlightedText(result, 'content', result.source.content || '').length > 200 ? '...' : '')}
                  />
                </div>

                {/* Result Metadata */}
                <div className="result-metadata">
                  <div className="metadata-left">
                    {/* Author/Creator */}
                    {(result.source.author || result.source.instructor) && (
                      <div className="metadata-item author">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        <span>
                          {result.source.author?.name || result.source.instructor?.name || 'Unknown'}
                        </span>
                      </div>
                    )}

                    {/* Date */}
                    {result.source.createdAt && (
                      <div className="metadata-item date">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                        </svg>
                        <span>{formatDate(result.source.createdAt)}</span>
                      </div>
                    )}

                    {/* Category/Tags */}
                    {(result.source.category || result.source.categories) && (
                      <div className="metadata-item category">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z"/>
                        </svg>
                        <span>
                          {result.source.category || 
                           (Array.isArray(result.source.categories) 
                             ? result.source.categories[0] 
                             : result.source.categories)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="metadata-right">
                    {/* Views */}
                    {result.source.views && (
                      <div className="metadata-item views">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                        <span>{result.source.views.toLocaleString()}</span>
                      </div>
                    )}

                    {/* Rating */}
                    {result.source.rating && (
                      <div className="metadata-item rating">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                        </svg>
                        <span>{result.source.rating.toFixed(1)}</span>
                      </div>
                    )}

                    {/* Difficulty */}
                    {result.source.difficulty && (
                      <div className={`metadata-item difficulty ${result.source.difficulty.toLowerCase()}`}>
                        <span>{result.source.difficulty}</span>
                      </div>
                    )}

                    {/* Price */}
                    {result.source.price !== undefined && result.source.price !== null && (
                      <div className="metadata-item price">
                        <span>
                          {result.source.price === 0 ? 'Free' : `$${result.source.price}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {result.source.tags && Array.isArray(result.source.tags) && result.source.tags.length > 0 && (
                  <div className="result-tags">
                    {result.source.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span key={tagIndex} className="result-tag">
                        #{tag}
                      </span>
                    ))}
                    {result.source.tags.length > 3 && (
                      <span className="tag-more">+{result.source.tags.length - 3} more</span>
                    )}
                  </div>
                )}

                {/* Highlight Snippets */}
                {result.highlight && Object.keys(result.highlight).length > 0 && (
                  <div className="result-snippets">
                    {Object.entries(result.highlight).slice(0, 2).map(([field, highlights]) => (
                      <div key={field} className="snippet">
                        <span className="snippet-field">{field}:</span>
                        <span className="snippet-text">
                          ...{highlights.join('...')}...
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SearchResults;