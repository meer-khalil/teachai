import React, { useState, useEffect } from 'react';
import { useContent } from '../../contexts/ContentContext';
import './ContentSettings.css';

const ContentSettings = ({ contentId }) => {
  const {
    currentContent,
    loading,
    updateContent,
    updateContentSettings
  } = useContent();

  const [settings, setSettings] = useState({
    visibility: 'public',
    status: 'draft',
    publishDate: '',
    expiryDate: '',
    allowComments: true,
    allowSharing: true,
    seoEnabled: true,
    password: '',
    categories: [],
    tags: [],
    featured: false,
    priority: 'normal',
    template: 'default',
    language: 'en',
    author: '',
    collaborators: [],
    notifications: {
      onPublish: true,
      onComment: true,
      onShare: false
    },
    advanced: {
      customCSS: '',
      customJS: '',
      canonicalUrl: '',
      noIndex: false,
      noFollow: false
    }
  });

  const [activeSection, setActiveSection] = useState('general');
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    if (currentContent && currentContent.settings) {
      setSettings(prev => ({
        ...prev,
        ...currentContent.settings
      }));
    }
  }, [currentContent]);

  const handleSettingChange = (section, field, value) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      if (section) {
        newSettings[section] = { ...newSettings[section], [field]: value };
      } else {
        newSettings[field] = value;
      }
      return newSettings;
    });
    setUnsavedChanges(true);
  };

  const handleSaveSettings = async () => {
    try {
      await updateContentSettings(contentId, settings);
      setUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

  const handleResetSettings = () => {
    if (currentContent && currentContent.settings) {
      setSettings(prev => ({
        ...prev,
        ...currentContent.settings
      }));
    }
    setUnsavedChanges(false);
  };

  const sections = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'publishing', label: 'Publishing', icon: '📤' },
    { id: 'access', label: 'Access & Privacy', icon: '🔒' },
    { id: 'seo', label: 'SEO & Meta', icon: '🔍' },
    { id: 'collaboration', label: 'Collaboration', icon: '👥' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'advanced', label: 'Advanced', icon: '🛠️' }
  ];

  const renderGeneralSettings = () => (
    <div className="settings-section">
      <h3>General Settings</h3>
      
      <div className="setting-group">
        <label className="setting-label">
          Template
          <select
            value={settings.template}
            onChange={(e) => handleSettingChange(null, 'template', e.target.value)}
            className="setting-select"
          >
            <option value="default">Default</option>
            <option value="blog">Blog Post</option>
            <option value="article">Article</option>
            <option value="landing">Landing Page</option>
            <option value="documentation">Documentation</option>
            <option value="custom">Custom</option>
          </select>
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          Language
          <select
            value={settings.language}
            onChange={(e) => handleSettingChange(null, 'language', e.target.value)}
            className="setting-select"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
          </select>
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          Author
          <input
            type="text"
            value={settings.author}
            onChange={(e) => handleSettingChange(null, 'author', e.target.value)}
            className="setting-input"
            placeholder="Content author name"
          />
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          Priority
          <select
            value={settings.priority}
            onChange={(e) => handleSettingChange(null, 'priority', e.target.value)}
            className="setting-select"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.featured}
            onChange={(e) => handleSettingChange(null, 'featured', e.target.checked)}
          />
          <span className="checkbox-custom"></span>
          Featured Content
          <span className="setting-description">Mark this content as featured</span>
        </label>
      </div>
    </div>
  );

  const renderPublishingSettings = () => (
    <div className="settings-section">
      <h3>Publishing Settings</h3>
      
      <div className="setting-group">
        <label className="setting-label">
          Status
          <select
            value={settings.status}
            onChange={(e) => handleSettingChange(null, 'status', e.target.value)}
            className="setting-select"
          >
            <option value="draft">Draft</option>
            <option value="review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          Publish Date
          <input
            type="datetime-local"
            value={settings.publishDate}
            onChange={(e) => handleSettingChange(null, 'publishDate', e.target.value)}
            className="setting-input"
          />
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          Expiry Date (Optional)
          <input
            type="datetime-local"
            value={settings.expiryDate}
            onChange={(e) => handleSettingChange(null, 'expiryDate', e.target.value)}
            className="setting-input"
          />
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          Categories
          <input
            type="text"
            value={settings.categories.join(', ')}
            onChange={(e) => handleSettingChange(null, 'categories', e.target.value.split(',').map(cat => cat.trim()))}
            className="setting-input"
            placeholder="Separate categories with commas"
          />
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          Tags
          <input
            type="text"
            value={settings.tags.join(', ')}
            onChange={(e) => handleSettingChange(null, 'tags', e.target.value.split(',').map(tag => tag.trim()))}
            className="setting-input"
            placeholder="Separate tags with commas"
          />
        </label>
      </div>
    </div>
  );

  const renderAccessSettings = () => (
    <div className="settings-section">
      <h3>Access & Privacy</h3>
      
      <div className="setting-group">
        <label className="setting-label">
          Visibility
          <select
            value={settings.visibility}
            onChange={(e) => handleSettingChange(null, 'visibility', e.target.value)}
            className="setting-select"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="password">Password Protected</option>
            <option value="unlisted">Unlisted</option>
          </select>
        </label>
      </div>

      {settings.visibility === 'password' && (
        <div className="setting-group">
          <label className="setting-label">
            Password
            <input
              type="password"
              value={settings.password}
              onChange={(e) => handleSettingChange(null, 'password', e.target.value)}
              className="setting-input"
              placeholder="Enter password"
            />
          </label>
        </div>
      )}

      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.allowComments}
            onChange={(e) => handleSettingChange(null, 'allowComments', e.target.checked)}
          />
          <span className="checkbox-custom"></span>
          Allow Comments
          <span className="setting-description">Enable commenting on this content</span>
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.allowSharing}
            onChange={(e) => handleSettingChange(null, 'allowSharing', e.target.checked)}
          />
          <span className="checkbox-custom"></span>
          Allow Sharing
          <span className="setting-description">Enable social sharing buttons</span>
        </label>
      </div>
    </div>
  );

  const renderSEOSettings = () => (
    <div className="settings-section">
      <h3>SEO & Meta Settings</h3>
      
      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.seoEnabled}
            onChange={(e) => handleSettingChange(null, 'seoEnabled', e.target.checked)}
          />
          <span className="checkbox-custom"></span>
          Enable SEO Optimization
          <span className="setting-description">Optimize content for search engines</span>
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          Canonical URL
          <input
            type="url"
            value={settings.advanced.canonicalUrl}
            onChange={(e) => handleSettingChange('advanced', 'canonicalUrl', e.target.value)}
            className="setting-input"
            placeholder="https://example.com/canonical-url"
          />
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.advanced.noIndex}
            onChange={(e) => handleSettingChange('advanced', 'noIndex', e.target.checked)}
          />
          <span className="checkbox-custom"></span>
          No Index
          <span className="setting-description">Prevent search engines from indexing</span>
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.advanced.noFollow}
            onChange={(e) => handleSettingChange('advanced', 'noFollow', e.target.checked)}
          />
          <span className="checkbox-custom"></span>
          No Follow
          <span className="setting-description">Prevent search engines from following links</span>
        </label>
      </div>
    </div>
  );

  const renderCollaborationSettings = () => (
    <div className="settings-section">
      <h3>Collaboration Settings</h3>
      
      <div className="setting-group">
        <label className="setting-label">
          Collaborators
          <input
            type="text"
            value={settings.collaborators.join(', ')}
            onChange={(e) => handleSettingChange(null, 'collaborators', e.target.value.split(',').map(collab => collab.trim()))}
            className="setting-input"
            placeholder="Enter email addresses, separated by commas"
          />
        </label>
        <div className="setting-description">
          Invite collaborators by email address. They will receive editing permissions.
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="settings-section">
      <h3>Notification Settings</h3>
      
      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.notifications.onPublish}
            onChange={(e) => handleSettingChange('notifications', 'onPublish', e.target.checked)}
          />
          <span className="checkbox-custom"></span>
          Notify on Publish
          <span className="setting-description">Send notification when content is published</span>
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.notifications.onComment}
            onChange={(e) => handleSettingChange('notifications', 'onComment', e.target.checked)}
          />
          <span className="checkbox-custom"></span>
          Notify on Comments
          <span className="setting-description">Send notification for new comments</span>
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.notifications.onShare}
            onChange={(e) => handleSettingChange('notifications', 'onShare', e.target.checked)}
          />
          <span className="checkbox-custom"></span>
          Notify on Shares
          <span className="setting-description">Send notification when content is shared</span>
        </label>
      </div>
    </div>
  );

  const renderAdvancedSettings = () => (
    <div className="settings-section">
      <h3>Advanced Settings</h3>
      
      <div className="setting-group">
        <label className="setting-label">
          Custom CSS
          <textarea
            value={settings.advanced.customCSS}
            onChange={(e) => handleSettingChange('advanced', 'customCSS', e.target.value)}
            className="setting-textarea"
            rows="6"
            placeholder="/* Add custom CSS styles here */"
          />
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          Custom JavaScript
          <textarea
            value={settings.advanced.customJS}
            onChange={(e) => handleSettingChange('advanced', 'customJS', e.target.value)}
            className="setting-textarea"
            rows="6"
            placeholder="/* Add custom JavaScript code here */"
          />
        </label>
      </div>

      <div className="setting-warning">
        <div className="warning-icon">⚠️</div>
        <div>
          <strong>Warning:</strong> Custom CSS and JavaScript can affect the appearance and functionality 
          of your content. Only add code from trusted sources.
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'general': return renderGeneralSettings();
      case 'publishing': return renderPublishingSettings();
      case 'access': return renderAccessSettings();
      case 'seo': return renderSEOSettings();
      case 'collaboration': return renderCollaborationSettings();
      case 'notifications': return renderNotificationSettings();
      case 'advanced': return renderAdvancedSettings();
      default: return renderGeneralSettings();
    }
  };

  if (loading.content) {
    return (
      <div className="settings-loading">
        <div className="loading-spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="content-settings">
      <div className="settings-header">
        <h2>Content Settings</h2>
        <div className="header-actions">
          {unsavedChanges && (
            <button 
              className="reset-button"
              onClick={handleResetSettings}
            >
              Reset
            </button>
          )}
          <button 
            className="save-button"
            onClick={handleSaveSettings}
            disabled={!unsavedChanges}
          >
            <span className="button-icon">💾</span>
            Save Settings
          </button>
        </div>
      </div>

      <div className="settings-container">
        {/* Settings Navigation */}
        <div className="settings-nav">
          {sections.map(section => (
            <button
              key={section.id}
              className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="nav-icon">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="settings-content">
          {renderSection()}
        </div>
      </div>

      {unsavedChanges && (
        <div className="unsaved-changes-notice">
          <div className="notice-content">
            <span className="notice-icon">⚠️</span>
            You have unsaved changes. Don't forget to save your settings.
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentSettings;