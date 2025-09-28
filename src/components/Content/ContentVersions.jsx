import React, { useState, useEffect } from 'react';
import { useContent } from '../../contexts/ContentContext';
import './ContentVersions.css';

const ContentVersions = ({ contentId }) => {
  const {
    versions,
    currentVersion,
    loading,
    getContentVersions,
    revertToVersion
  } = useContent();

  const [selectedVersionA, setSelectedVersionA] = useState(null);
  const [selectedVersionB, setSelectedVersionB] = useState(null);
  const [showDiff, setShowDiff] = useState(false);
  const [diffData, setDiffData] = useState(null);
  const [expandedVersion, setExpandedVersion] = useState(null);

  useEffect(() => {
    if (contentId) {
      loadVersions();
    }
  }, [contentId]);

  const loadVersions = async () => {
    try {
      await getContentVersions(contentId);
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  };

  const handleRevert = async (versionNumber) => {
    if (window.confirm(`Are you sure you want to revert to version ${versionNumber}? This will create a new version with the reverted content.`)) {
      try {
        await revertToVersion(contentId, versionNumber);
        await loadVersions(); // Reload versions
      } catch (error) {
        console.error('Failed to revert version:', error);
        alert('Failed to revert to this version. Please try again.');
      }
    }
  };

  const handleCompare = async () => {
    if (!selectedVersionA || !selectedVersionB) {
      alert('Please select two versions to compare');
      return;
    }

    try {
      const response = await fetch(
        `/api/v1/content/${contentId}/versions/diff?versionA=${selectedVersionA}&versionB=${selectedVersionB}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDiffData(data.data);
        setShowDiff(true);
      }
    } catch (error) {
      console.error('Failed to get diff:', error);
      alert('Failed to compare versions. Please try again.');
    }
  };

  const toggleVersionDetails = (versionNumber) => {
    setExpandedVersion(expandedVersion === versionNumber ? null : versionNumber);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVersionStatus = (version) => {
    if (version.versionNumber === currentVersion) {
      return 'current';
    }
    return 'archived';
  };

  const renderDiffContent = (diff) => {
    if (!diff || !Array.isArray(diff)) return null;

    return (
      <div className="diff-content">
        {diff.map((part, index) => {
          const [operation, text] = part;
          let className = 'diff-part';
          
          if (operation === 1) className += ' diff-added';
          else if (operation === -1) className += ' diff-removed';
          else className += ' diff-unchanged';

          return (
            <span key={index} className={className}>
              {text}
            </span>
          );
        })}
      </div>
    );
  };

  if (loading.versions) {
    return (
      <div className="versions-loading">
        <div className="loading-spinner"></div>
        <p>Loading version history...</p>
      </div>
    );
  }

  return (
    <div className="content-versions">
      <div className="versions-header">
        <h2>Version History</h2>
        <p className="versions-description">
          Track changes and revert to previous versions of your content.
        </p>
      </div>

      {/* Version Comparison */}
      {versions.length > 1 && (
        <div className="version-comparison">
          <h3>Compare Versions</h3>
          <div className="comparison-controls">
            <div className="version-selector">
              <label>Version A:</label>
              <select 
                value={selectedVersionA || ''} 
                onChange={(e) => setSelectedVersionA(e.target.value)}
              >
                <option value="">Select version</option>
                <option value="current">Current Version</option>
                {versions.map(version => (
                  <option key={version.versionNumber} value={version.versionNumber}>
                    Version {version.versionNumber}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="version-selector">
              <label>Version B:</label>
              <select 
                value={selectedVersionB || ''} 
                onChange={(e) => setSelectedVersionB(e.target.value)}
              >
                <option value="">Select version</option>
                <option value="current">Current Version</option>
                {versions.map(version => (
                  <option key={version.versionNumber} value={version.versionNumber}>
                    Version {version.versionNumber}
                  </option>
                ))}
              </select>
            </div>
            
            <button 
              className="compare-button"
              onClick={handleCompare}
              disabled={!selectedVersionA || !selectedVersionB}
            >
              <span className="button-icon">🔄</span>
              Compare
            </button>
          </div>
        </div>
      )}

      {/* Diff View */}
      {showDiff && diffData && (
        <div className="diff-viewer">
          <div className="diff-header">
            <h3>Changes between versions</h3>
            <button 
              className="close-diff"
              onClick={() => setShowDiff(false)}
            >
              ✕
            </button>
          </div>
          <div className="diff-legend">
            <span className="legend-item">
              <span className="legend-color added"></span>
              Added
            </span>
            <span className="legend-item">
              <span className="legend-color removed"></span>
              Removed
            </span>
            <span className="legend-item">
              <span className="legend-color unchanged"></span>
              Unchanged
            </span>
          </div>
          {renderDiffContent(diffData.diff)}
        </div>
      )}

      {/* Version List */}
      <div className="versions-list">
        {versions.length === 0 ? (
          <div className="no-versions">
            <div className="no-versions-icon">📚</div>
            <h3>No Version History</h3>
            <p>Version history will appear here as you make changes to your content.</p>
          </div>
        ) : (
          <div className="version-items">
            {versions.sort((a, b) => b.versionNumber - a.versionNumber).map((version) => (
              <div 
                key={version.versionNumber} 
                className={`version-item ${getVersionStatus(version)}`}
              >
                <div className="version-header" onClick={() => toggleVersionDetails(version.versionNumber)}>
                  <div className="version-info">
                    <div className="version-number">
                      <span className="version-badge">
                        v{version.versionNumber}
                      </span>
                      {version.versionNumber === currentVersion && (
                        <span className="current-badge">Current</span>
                      )}
                    </div>
                    
                    <div className="version-meta">
                      <div className="version-author">
                        {version.author?.name || 'Unknown Author'}
                      </div>
                      <div className="version-date">
                        {formatDate(version.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="version-summary">
                    <div className="version-changes">
                      {version.changes || 'No description provided'}
                    </div>
                    
                    <div className="version-stats">
                      <span className="stat">
                        <span className="stat-icon">📝</span>
                        {version.metadata?.wordCount || 0} words
                      </span>
                      <span className="stat">
                        <span className="stat-icon">🔤</span>
                        {version.metadata?.characterCount || 0} chars
                      </span>
                      <span className="stat">
                        <span className="stat-icon">⏱️</span>
                        {version.metadata?.readingTime || 0} min read
                      </span>
                    </div>
                  </div>

                  <div className="version-actions">
                    <button
                      className="action-button expand-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVersionDetails(version.versionNumber);
                      }}
                      title="View details"
                    >
                      <span className={`expand-icon ${expandedVersion === version.versionNumber ? 'expanded' : ''}`}>
                        ▼
                      </span>
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedVersion === version.versionNumber && (
                  <div className="version-details">
                    <div className="version-content-preview">
                      <h4>Content Preview:</h4>
                      <div className="content-preview">
                        {version.content.substring(0, 500)}
                        {version.content.length > 500 && '...'}
                      </div>
                    </div>
                    
                    <div className="version-metadata">
                      <h4>Metadata:</h4>
                      <div className="metadata-grid">
                        <div className="metadata-item">
                          <span className="metadata-label">Word Count:</span>
                          <span className="metadata-value">{version.metadata?.wordCount || 0}</span>
                        </div>
                        <div className="metadata-item">
                          <span className="metadata-label">Character Count:</span>
                          <span className="metadata-value">{version.metadata?.characterCount || 0}</span>
                        </div>
                        <div className="metadata-item">
                          <span className="metadata-label">Reading Time:</span>
                          <span className="metadata-value">{version.metadata?.readingTime || 0} minutes</span>
                        </div>
                        <div className="metadata-item">
                          <span className="metadata-label">Last Modified:</span>
                          <span className="metadata-value">
                            {version.metadata?.lastModified ? formatDate(version.metadata.lastModified) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="version-detail-actions">
                      <button
                        className="detail-action-button compare"
                        onClick={() => {
                          setSelectedVersionA(version.versionNumber.toString());
                          setSelectedVersionB('current');
                        }}
                      >
                        <span className="button-icon">🔄</span>
                        Compare with Current
                      </button>
                      
                      {version.versionNumber !== currentVersion && (
                        <button
                          className="detail-action-button revert"
                          onClick={() => handleRevert(version.versionNumber)}
                        >
                          <span className="button-icon">↩️</span>
                          Revert to This Version
                        </button>
                      )}
                      
                      <button
                        className="detail-action-button download"
                        onClick={() => {
                          const blob = new Blob([version.content], { type: 'text/html' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `version-${version.versionNumber}.html`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <span className="button-icon">💾</span>
                        Download
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentVersions;