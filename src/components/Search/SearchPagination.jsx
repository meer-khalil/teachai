import React, { useState, useContext } from 'react';
import { SearchContext } from '../../contexts/SearchContext';
import './SearchPagination.css';

const SearchPagination = () => {
  const {
    searchResults,
    pagination,
    searchQuery,
    performSearch
  } = useContext(SearchContext);

  const [pageSizeInput, setPageSizeInput] = useState(pagination.pageSize || 10);

  if (!searchResults || searchResults.length === 0 || !pagination) {
    return null;
  }

  const {
    currentPage,
    totalPages,
    totalResults,
    pageSize,
    hasNext,
    hasPrevious
  } = pagination;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      performSearch(searchQuery, { page: newPage, pageSize });
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    const validPageSize = Math.max(5, Math.min(100, newPageSize));
    setPageSizeInput(validPageSize);
    performSearch(searchQuery, { page: 1, pageSize: validPageSize });
  };

  const handleKeyPress = (e, handler, ...args) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handler(...args);
    }
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 7;
    const sidePages = Math.floor(maxVisiblePages / 2);

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      if (currentPage <= sidePages + 2) {
        // Current page is near the beginning
        for (let i = 2; i <= Math.min(maxVisiblePages - 1, totalPages - 1); i++) {
          pages.push(i);
        }
        if (totalPages > maxVisiblePages - 1) {
          pages.push('...');
        }
      } else if (currentPage >= totalPages - sidePages - 1) {
        // Current page is near the end
        if (totalPages > maxVisiblePages - 1) {
          pages.push('...');
        }
        for (let i = Math.max(2, totalPages - maxVisiblePages + 2); i <= totalPages - 1; i++) {
          pages.push(i);
        }
      } else {
        // Current page is in the middle
        pages.push('...');
        for (let i = currentPage - sidePages; i <= currentPage + sidePages; i++) {
          pages.push(i);
        }
        pages.push('...');
      }

      // Show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const startResult = (currentPage - 1) * pageSize + 1;
  const endResult = Math.min(currentPage * pageSize, totalResults);

  return (
    <div className="search-pagination">
      {/* Results Info */}
      <div className="pagination-info">
        <span className="results-count">
          Showing {startResult.toLocaleString()}-{endResult.toLocaleString()} of{' '}
          {totalResults.toLocaleString()} results
        </span>
        
        {/* Page Size Selector */}
        <div className="page-size-selector">
          <label htmlFor="page-size" className="page-size-label">
            Show:
          </label>
          <select
            id="page-size"
            value={pageSizeInput}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="page-size-select"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="page-size-suffix">per page</span>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            onKeyPress={(e) => handleKeyPress(e, handlePageChange, currentPage - 1)}
            disabled={!hasPrevious}
            className={`pagination-button pagination-prev ${!hasPrevious ? 'disabled' : ''}`}
            aria-label="Go to previous page"
            title="Previous page"
          >
            <span className="pagination-icon">‹</span>
            <span className="pagination-text">Previous</span>
          </button>

          {/* Page Numbers */}
          <div className="pagination-pages" role="navigation" aria-label="Page navigation">
            {generatePageNumbers().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="pagination-ellipsis" aria-hidden="true">
                    …
                  </span>
                ) : (
                  <button
                    onClick={() => handlePageChange(page)}
                    onKeyPress={(e) => handleKeyPress(e, handlePageChange, page)}
                    className={`pagination-button pagination-page ${
                      currentPage === page ? 'active' : ''
                    }`}
                    aria-label={`Go to page ${page}`}
                    aria-current={currentPage === page ? 'page' : undefined}
                    title={`Page ${page}`}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            onKeyPress={(e) => handleKeyPress(e, handlePageChange, currentPage + 1)}
            disabled={!hasNext}
            className={`pagination-button pagination-next ${!hasNext ? 'disabled' : ''}`}
            aria-label="Go to next page"
            title="Next page"
          >
            <span className="pagination-text">Next</span>
            <span className="pagination-icon">›</span>
          </button>
        </div>
      )}

      {/* Mobile Pagination */}
      <div className="pagination-mobile">
        <button
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={!hasPrevious}
          className={`mobile-pagination-button ${!hasPrevious ? 'disabled' : ''}`}
          aria-label="Previous page"
        >
          <span className="mobile-pagination-icon">‹</span>
          Previous
        </button>
        
        <div className="mobile-page-info">
          <span className="mobile-current-page">{currentPage}</span>
          <span className="mobile-page-separator">of</span>
          <span className="mobile-total-pages">{totalPages}</span>
        </div>
        
        <button
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={!hasNext}
          className={`mobile-pagination-button ${!hasNext ? 'disabled' : ''}`}
          aria-label="Next page"
        >
          Next
          <span className="mobile-pagination-icon">›</span>
        </button>
      </div>

      {/* Jump to Page */}
      <div className="pagination-jump">
        <label htmlFor="jump-to-page" className="jump-label">
          Go to page:
        </label>
        <input
          id="jump-to-page"
          type="number"
          min="1"
          max={totalPages}
          className="jump-input"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const page = Number(e.target.value);
              if (page >= 1 && page <= totalPages) {
                handlePageChange(page);
                e.target.value = '';
              }
            }
          }}
          onBlur={(e) => {
            e.target.value = '';
          }}
          placeholder={`1-${totalPages}`}
          aria-label={`Jump to page (1-${totalPages})`}
        />
      </div>

      {/* Loading Indicator */}
      <div className="pagination-loading" style={{ display: 'none' }}>
        <div className="pagination-spinner"></div>
        <span>Loading results...</span>
      </div>
    </div>
  );
};

export default SearchPagination;