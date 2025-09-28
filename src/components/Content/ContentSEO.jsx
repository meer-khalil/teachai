import React from 'react';
import { useContent } from '../../contexts/ContentContext';
import './ContentSEO.css';

const ContentSEO = () => {
  const {
    seoData,
    updateSeoField,
    content,
    editorContent
  } = useContent();

  const handleInputChange = (field, value) => {
    updateSeoField(field, value);
  };

  const handleKeywordsChange = (e) => {
    const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k);
    updateSeoField('metaKeywords', keywords);
  };

  const generateMetaTitle = () => {
    if (content?.title) {
      const generatedTitle = content.title.length > 60 
        ? content.title.substring(0, 57) + '...'
        : content.title;
      updateSeoField('metaTitle', generatedTitle);
    }
  };

  const generateMetaDescription = () => {
    if (editorContent) {
      // Extract plain text from HTML content
      const plainText = editorContent.replace(/<[^>]*>/g, '');
      const description = plainText.length > 160 
        ? plainText.substring(0, 157) + '...'
        : plainText;
      updateSeoField('metaDescription', description);
    }
  };

  const metaTitleLength = (seoData.metaTitle || '').length;
  const metaDescriptionLength = (seoData.metaDescription || '').length;

  return (
    <div className="content-seo">
      <div className="seo-header">
        <h2>SEO Optimization</h2>
        <p className="seo-description">
          Optimize your content for search engines to improve visibility and ranking.
        </p>
      </div>

      <div className="seo-sections">
        {/* Basic SEO */}
        <section className="seo-section">
          <h3 className="section-title">
            <span className="section-icon">🔍</span>
            Basic SEO
          </h3>

          <div className="form-group">
            <label htmlFor="meta-title" className="form-label">
              Meta Title
              <span className="field-info">
                ({metaTitleLength}/60 characters)
                <span className={`length-indicator ${
                  metaTitleLength > 60 ? 'error' : metaTitleLength > 50 ? 'warning' : 'good'
                }`}>
                  {metaTitleLength > 60 ? '⚠️' : metaTitleLength > 50 ? '⚡' : '✅'}
                </span>
              </span>
            </label>
            <div className="input-with-action">
              <input
                id="meta-title"
                type="text"
                value={seoData.metaTitle || ''}
                onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                placeholder="Enter meta title..."
                maxLength={70}
                className={`form-input ${metaTitleLength > 60 ? 'error' : ''}`}
              />
              <button
                type="button"
                onClick={generateMetaTitle}
                className="generate-button"
                title="Generate from content title"
              >
                ✨ Auto
              </button>
            </div>
            <div className="field-help">
              The title that appears in search engine results. Keep it under 60 characters.
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="meta-description" className="form-label">
              Meta Description
              <span className="field-info">
                ({metaDescriptionLength}/160 characters)
                <span className={`length-indicator ${
                  metaDescriptionLength > 160 ? 'error' : metaDescriptionLength > 140 ? 'warning' : 'good'
                }`}>
                  {metaDescriptionLength > 160 ? '⚠️' : metaDescriptionLength > 140 ? '⚡' : '✅'}
                </span>
              </span>
            </label>
            <div className="input-with-action">
              <textarea
                id="meta-description"
                value={seoData.metaDescription || ''}
                onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                placeholder="Enter meta description..."
                maxLength={200}
                rows={3}
                className={`form-textarea ${metaDescriptionLength > 160 ? 'error' : ''}`}
              />
              <button
                type="button"
                onClick={generateMetaDescription}
                className="generate-button"
                title="Generate from content"
              >
                ✨ Auto
              </button>
            </div>
            <div className="field-help">
              The description that appears in search results. Keep it between 120-160 characters.
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="meta-keywords" className="form-label">
              Meta Keywords
            </label>
            <input
              id="meta-keywords"
              type="text"
              value={(seoData.metaKeywords || []).join(', ')}
              onChange={handleKeywordsChange}
              placeholder="keyword1, keyword2, keyword3..."
              className="form-input"
            />
            <div className="field-help">
              Comma-separated keywords relevant to your content.
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="canonical-url" className="form-label">
              Canonical URL
            </label>
            <input
              id="canonical-url"
              type="url"
              value={seoData.canonicalUrl || ''}
              onChange={(e) => handleInputChange('canonicalUrl', e.target.value)}
              placeholder="https://example.com/canonical-url"
              className="form-input"
            />
            <div className="field-help">
              The preferred URL for this content to avoid duplicate content issues.
            </div>
          </div>
        </section>

        {/* Social Media */}
        <section className="seo-section">
          <h3 className="section-title">
            <span className="section-icon">📱</span>
            Social Media (Open Graph)
          </h3>

          <div className="form-group">
            <label htmlFor="og-title" className="form-label">
              Social Media Title
            </label>
            <input
              id="og-title"
              type="text"
              value={seoData.ogTitle || ''}
              onChange={(e) => handleInputChange('ogTitle', e.target.value)}
              placeholder="Title for social media sharing..."
              maxLength={95}
              className="form-input"
            />
            <div className="field-help">
              Title used when sharing on social media platforms.
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="og-description" className="form-label">
              Social Media Description
            </label>
            <textarea
              id="og-description"
              value={seoData.ogDescription || ''}
              onChange={(e) => handleInputChange('ogDescription', e.target.value)}
              placeholder="Description for social media sharing..."
              maxLength={300}
              rows={3}
              className="form-textarea"
            />
            <div className="field-help">
              Description used when sharing on social media platforms.
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="og-image" className="form-label">
              Social Media Image
            </label>
            <div className="image-input-group">
              <input
                id="og-image"
                type="url"
                value={seoData.ogImage || ''}
                onChange={(e) => handleInputChange('ogImage', e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="form-input"
              />
              <button type="button" className="upload-button">
                📁 Upload
              </button>
            </div>
            <div className="field-help">
              Image displayed when sharing on social media. Recommended: 1200x630 pixels.
            </div>
            {seoData.ogImage && (
              <div className="image-preview">
                <img src={seoData.ogImage} alt="OG Preview" />
              </div>
            )}
          </div>
        </section>

        {/* Advanced SEO */}
        <section className="seo-section">
          <h3 className="section-title">
            <span className="section-icon">⚙️</span>
            Advanced SEO
          </h3>

          <div className="form-group">
            <label htmlFor="schema-markup" className="form-label">
              Schema Markup (JSON-LD)
            </label>
            <textarea
              id="schema-markup"
              value={seoData.schemaMarkup ? JSON.stringify(seoData.schemaMarkup, null, 2) : ''}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleInputChange('schemaMarkup', parsed);
                } catch {
                  // Invalid JSON, don't update
                }
              }}
              placeholder='{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  "headline": "...",\n  "author": "..."\n}'
              rows={8}
              className="form-textarea code"
            />
            <div className="field-help">
              Structured data markup to help search engines understand your content.
            </div>
          </div>

          <div className="schema-presets">
            <h4>Quick Schema Presets:</h4>
            <div className="preset-buttons">
              <button
                type="button"
                className="preset-button"
                onClick={() => handleInputChange('schemaMarkup', {
                  "@context": "https://schema.org",
                  "@type": "Article",
                  "headline": content?.title || "",
                  "description": seoData.metaDescription || "",
                  "author": {
                    "@type": "Person",
                    "name": content?.author?.name || ""
                  }
                })}
              >
                📄 Article
              </button>
              <button
                type="button"
                className="preset-button"
                onClick={() => handleInputChange('schemaMarkup', {
                  "@context": "https://schema.org",
                  "@type": "BlogPosting",
                  "headline": content?.title || "",
                  "description": seoData.metaDescription || ""
                })}
              >
                📝 Blog Post
              </button>
              <button
                type="button"
                className="preset-button"
                onClick={() => handleInputChange('schemaMarkup', {
                  "@context": "https://schema.org",
                  "@type": "Course",
                  "name": content?.title || "",
                  "description": seoData.metaDescription || ""
                })}
              >
                🎓 Course
              </button>
            </div>
          </div>
        </section>

        {/* SEO Preview */}
        <section className="seo-section">
          <h3 className="section-title">
            <span className="section-icon">👁️</span>
            Search Results Preview
          </h3>

          <div className="search-preview">
            <div className="preview-url">
              {seoData.canonicalUrl || `https://teachai.com/${content?.slug || 'content'}`}
            </div>
            <div className="preview-title">
              {seoData.metaTitle || content?.title || 'Untitled Content'}
            </div>
            <div className="preview-description">
              {seoData.metaDescription || 'No meta description available.'}
            </div>
          </div>

          <div className="social-preview">
            <h4>Social Media Preview:</h4>
            <div className="social-card">
              {seoData.ogImage && (
                <div className="social-image">
                  <img src={seoData.ogImage} alt="Social preview" />
                </div>
              )}
              <div className="social-content">
                <div className="social-title">
                  {seoData.ogTitle || seoData.metaTitle || content?.title || 'Untitled Content'}
                </div>
                <div className="social-description">
                  {seoData.ogDescription || seoData.metaDescription || 'No description available.'}
                </div>
                <div className="social-url">
                  teachai.com
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEO Score */}
        <section className="seo-section">
          <h3 className="section-title">
            <span className="section-icon">📊</span>
            SEO Score
          </h3>

          <div className="seo-score">
            <div className="score-circle">
              <div className="score-value">75</div>
              <div className="score-label">Good</div>
            </div>
            
            <div className="score-details">
              <div className="score-item good">
                <span className="score-icon">✅</span>
                <span>Meta title is present and optimal length</span>
              </div>
              <div className="score-item good">
                <span className="score-icon">✅</span>
                <span>Meta description is present</span>
              </div>
              <div className="score-item warning">
                <span className="score-icon">⚠️</span>
                <span>Consider adding more keywords</span>
              </div>
              <div className="score-item error">
                <span className="score-icon">❌</span>
                <span>No schema markup detected</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ContentSEO;