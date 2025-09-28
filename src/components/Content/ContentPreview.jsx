import React, { useState } from 'react';
import { useContent } from '../../contexts/ContentContext';
import './ContentPreview.css';

const ContentPreview = ({ contentId }) => {
  const { currentContent, loading } = useContent();
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [previewTheme, setPreviewTheme] = useState('light');
  const [showOutline, setShowOutline] = useState(false);
  const [previewMode, setPreviewMode] = useState('rendered');

  const devices = {
    desktop: { width: '100%', height: '100%', icon: '🖥️' },
    tablet: { width: '768px', height: '1024px', icon: '📱' },
    mobile: { width: '375px', height: '667px', icon: '📱' },
    mobile_large: { width: '414px', height: '896px', icon: '📱' }
  };

  const generateOutline = (content) => {
    if (!content) return [];
    
    // Extract headings from HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    return Array.from(headings).map((heading, index) => ({
      id: `heading-${index}`,
      level: parseInt(heading.tagName.charAt(1)),
      text: heading.textContent.trim(),
      element: heading.tagName.toLowerCase()
    }));
  };

  const scrollToHeading = (headingId) => {
    const previewFrame = document.getElementById('preview-frame');
    if (previewFrame && previewFrame.contentDocument) {
      const heading = previewFrame.contentDocument.getElementById(headingId);
      if (heading) {
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const renderPreviewContent = () => {
    if (!currentContent?.content) {
      return `
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Preview</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 40px;
                background: ${previewTheme === 'dark' ? '#1a1a1a' : '#ffffff'};
                color: ${previewTheme === 'dark' ? '#ffffff' : '#333333'};
              }
              .empty-preview {
                text-align: center;
                padding: 60px 20px;
                color: #666;
              }
              .empty-icon {
                font-size: 48px;
                margin-bottom: 16px;
              }
            </style>
          </head>
          <body>
            <div class="empty-preview">
              <div class="empty-icon">📄</div>
              <h2>No Content to Preview</h2>
              <p>Start writing in the editor to see your content here.</p>
            </div>
          </body>
        </html>
      `;
    }

    const outline = generateOutline(currentContent.content);
    const contentWithIds = currentContent.content.replace(
      /<(h[1-6])[^>]*>/g,
      (match, tag, index) => {
        const headingIndex = outline.findIndex(h => h.element === tag.toLowerCase());
        return match.replace('>', ` id="heading-${headingIndex}">`);
      }
    );

    return `
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${currentContent.title || 'Preview'}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 40px;
              background: ${previewTheme === 'dark' ? '#1a1a1a' : '#ffffff'};
              color: ${previewTheme === 'dark' ? '#ffffff' : '#333333'};
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            h1, h2, h3, h4, h5, h6 {
              color: ${previewTheme === 'dark' ? '#ffffff' : '#2c3e50'};
              margin-top: 2em;
              margin-bottom: 1em;
            }
            h1 { font-size: 2.2em; border-bottom: 2px solid ${previewTheme === 'dark' ? '#444' : '#eee'}; padding-bottom: 0.5em; }
            h2 { font-size: 1.8em; }
            h3 { font-size: 1.5em; }
            h4 { font-size: 1.3em; }
            h5 { font-size: 1.1em; }
            h6 { font-size: 1em; }
            p { margin-bottom: 1.2em; }
            a {
              color: ${previewTheme === 'dark' ? '#66b3ff' : '#3498db'};
              text-decoration: none;
            }
            a:hover { text-decoration: underline; }
            blockquote {
              border-left: 4px solid ${previewTheme === 'dark' ? '#666' : '#e74c3c'};
              margin: 1.5em 0;
              padding: 0.5em 1em;
              background: ${previewTheme === 'dark' ? '#2a2a2a' : '#f8f9fa'};
              font-style: italic;
            }
            code {
              background: ${previewTheme === 'dark' ? '#2a2a2a' : '#f1f1f1'};
              padding: 2px 6px;
              border-radius: 4px;
              font-family: 'Monaco', 'Consolas', monospace;
              font-size: 0.9em;
            }
            pre {
              background: ${previewTheme === 'dark' ? '#2a2a2a' : '#f1f1f1'};
              padding: 1em;
              border-radius: 8px;
              overflow-x: auto;
              margin: 1.5em 0;
            }
            pre code {
              background: none;
              padding: 0;
            }
            img {
              max-width: 100%;
              height: auto;
              border-radius: 8px;
              margin: 1em 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 1.5em 0;
            }
            th, td {
              border: 1px solid ${previewTheme === 'dark' ? '#444' : '#ddd'};
              padding: 8px 12px;
              text-align: left;
            }
            th {
              background: ${previewTheme === 'dark' ? '#333' : '#f8f9fa'};
              font-weight: 600;
            }
            ul, ol {
              margin: 1em 0;
              padding-left: 2em;
            }
            li {
              margin-bottom: 0.5em;
            }
            .meta-info {
              background: ${previewTheme === 'dark' ? '#2a2a2a' : '#f8f9fa'};
              border: 1px solid ${previewTheme === 'dark' ? '#444' : '#e9ecef'};
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 2em;
              font-size: 0.9em;
            }
            .meta-title {
              font-weight: 600;
              margin-bottom: 8px;
              color: ${previewTheme === 'dark' ? '#ffffff' : '#495057'};
            }
            .meta-item {
              margin: 4px 0;
              color: ${previewTheme === 'dark' ? '#ccc' : '#666'};
            }
            @media (max-width: 768px) {
              body {
                padding: 20px 16px;
              }
              h1 { font-size: 1.8em; }
              h2 { font-size: 1.5em; }
              h3 { font-size: 1.3em; }
            }
          </style>
        </head>
        <body>
          ${currentContent.seo?.metaTitle || currentContent.seo?.metaDescription ? `
            <div class="meta-info">
              <div class="meta-title">SEO Information</div>
              ${currentContent.seo.metaTitle ? `<div class="meta-item"><strong>Title:</strong> ${currentContent.seo.metaTitle}</div>` : ''}
              ${currentContent.seo.metaDescription ? `<div class="meta-item"><strong>Description:</strong> ${currentContent.seo.metaDescription}</div>` : ''}
            </div>
          ` : ''}
          ${contentWithIds}
        </body>
      </html>
    `;
  };

  const renderSourceCode = () => {
    if (!currentContent?.content) return 'No content available';
    
    return `
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Source Code</title>
          <style>
            body {
              font-family: 'Monaco', 'Consolas', 'Ubuntu Mono', monospace;
              line-height: 1.5;
              margin: 0;
              padding: 20px;
              background: ${previewTheme === 'dark' ? '#1a1a1a' : '#f8f9fa'};
              color: ${previewTheme === 'dark' ? '#ffffff' : '#333333'};
            }
            .source-container {
              background: ${previewTheme === 'dark' ? '#2a2a2a' : '#ffffff'};
              border: 1px solid ${previewTheme === 'dark' ? '#444' : '#e9ecef'};
              border-radius: 8px;
              padding: 20px;
              white-space: pre-wrap;
              overflow-x: auto;
              font-size: 13px;
            }
            .line-numbers {
              color: ${previewTheme === 'dark' ? '#666' : '#999'};
              user-select: none;
              margin-right: 16px;
              display: inline-block;
              text-align: right;
              width: 40px;
            }
          </style>
        </head>
        <body>
          <div class="source-container">
            ${currentContent.content.split('\n').map((line, index) => 
              `<div><span class="line-numbers">${index + 1}</span>${line}</div>`
            ).join('')}
          </div>
        </body>
      </html>
    `;
  };

  const exportPreview = () => {
    const content = renderPreviewContent();
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentContent?.title || 'preview'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPreview = () => {
    const previewFrame = document.getElementById('preview-frame');
    if (previewFrame && previewFrame.contentWindow) {
      previewFrame.contentWindow.print();
    }
  };

  const outline = generateOutline(currentContent?.content);

  if (loading.content) {
    return (
      <div className="preview-loading">
        <div className="loading-spinner"></div>
        <p>Loading preview...</p>
      </div>
    );
  }

  return (
    <div className="content-preview">
      {/* Preview Controls */}
      <div className="preview-controls">
        <div className="control-group">
          <label>Device:</label>
          <div className="device-buttons">
            {Object.entries(devices).map(([device, config]) => (
              <button
                key={device}
                className={`device-button ${previewDevice === device ? 'active' : ''}`}
                onClick={() => setPreviewDevice(device)}
                title={device.replace('_', ' ')}
              >
                {config.icon}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label>Mode:</label>
          <div className="mode-buttons">
            <button
              className={`mode-button ${previewMode === 'rendered' ? 'active' : ''}`}
              onClick={() => setPreviewMode('rendered')}
            >
              <span className="button-icon">👁️</span>
              Preview
            </button>
            <button
              className={`mode-button ${previewMode === 'source' ? 'active' : ''}`}
              onClick={() => setPreviewMode('source')}
            >
              <span className="button-icon">💻</span>
              Source
            </button>
          </div>
        </div>

        <div className="control-group">
          <label>Theme:</label>
          <select 
            value={previewTheme} 
            onChange={(e) => setPreviewTheme(e.target.value)}
            className="theme-select"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div className="control-actions">
          <button
            className="outline-toggle"
            onClick={() => setShowOutline(!showOutline)}
            title="Toggle outline"
          >
            <span className="button-icon">📋</span>
            Outline
          </button>
          
          <button
            className="action-button"
            onClick={printPreview}
            title="Print preview"
          >
            <span className="button-icon">🖨️</span>
            Print
          </button>
          
          <button
            className="action-button"
            onClick={exportPreview}
            title="Export as HTML"
          >
            <span className="button-icon">💾</span>
            Export
          </button>
        </div>
      </div>

      {/* Preview Container */}
      <div className="preview-container">
        {/* Outline Sidebar */}
        {showOutline && outline.length > 0 && (
          <div className="preview-outline">
            <h3>Content Outline</h3>
            <div className="outline-list">
              {outline.map((heading) => (
                <div
                  key={heading.id}
                  className={`outline-item outline-level-${heading.level}`}
                  onClick={() => scrollToHeading(heading.id)}
                >
                  <span className="outline-text">{heading.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview Frame */}
        <div className="preview-frame-container">
          <div className="device-frame" style={{
            width: devices[previewDevice].width,
            height: devices[previewDevice].height,
            maxWidth: '100%',
            maxHeight: '100%'
          }}>
            <div className="device-screen">
              <iframe
                id="preview-frame"
                className="preview-iframe"
                title="Content Preview"
                srcDoc={previewMode === 'rendered' ? renderPreviewContent() : renderSourceCode()}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview Info */}
      {currentContent && (
        <div className="preview-info">
          <div className="info-item">
            <span className="info-label">Words:</span>
            <span className="info-value">
              {currentContent.content ? currentContent.content.replace(/<[^>]*>/g, '').split(/\s+/).length : 0}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Characters:</span>
            <span className="info-value">
              {currentContent.content ? currentContent.content.replace(/<[^>]*>/g, '').length : 0}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Reading Time:</span>
            <span className="info-value">
              {currentContent.content ? Math.ceil(currentContent.content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200) : 0} min
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Device:</span>
            <span className="info-value">{previewDevice.replace('_', ' ')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentPreview;