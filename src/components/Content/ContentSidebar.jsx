import React from 'react';
import './ContentSidebar.css';

const ContentSidebar = ({
  collapsed = false,
  activeTab = 'content',
  onTabChange,
  onToggle
}) => {
  const tabs = [
    {
      id: 'content',
      label: 'Content',
      icon: '📝',
      description: 'Edit your content'
    },
    {
      id: 'seo',
      label: 'SEO',
      icon: '🔍',
      description: 'Search engine optimization'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      description: 'Publishing and visibility settings'
    },
    {
      id: 'versions',
      label: 'Versions',
      icon: '📚',
      description: 'Version history and revisions'
    }
  ];

  const sidebarClasses = [
    'content-sidebar',
    collapsed ? 'collapsed' : 'expanded'
  ].join(' ');

  return (
    <aside className={sidebarClasses}>
      {/* Toggle Button */}
      <button
        className="sidebar-toggle"
        onClick={onToggle}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <span className={`toggle-icon ${collapsed ? 'collapsed' : 'expanded'}`}>
          {collapsed ? '▶' : '◀'}
        </span>
      </button>

      {/* Sidebar Content */}
      <div className="sidebar-content">
        {/* Navigation Tabs */}
        <nav className="sidebar-nav" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
              title={collapsed ? tab.label : tab.description}
            >
              <span className="tab-icon">{tab.icon}</span>
              {!collapsed && (
                <>
                  <span className="tab-label">{tab.label}</span>
                  <span className="tab-description">{tab.description}</span>
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Quick Actions */}
        {!collapsed && (
          <div className="sidebar-section">
            <h3 className="section-title">Quick Actions</h3>
            <div className="quick-actions">
              <button className="quick-action">
                <span className="action-icon">📋</span>
                <span className="action-label">Copy Link</span>
              </button>
              <button className="quick-action">
                <span className="action-icon">📤</span>
                <span className="action-label">Export</span>
              </button>
              <button className="quick-action">
                <span className="action-icon">🔗</span>
                <span className="action-label">Share</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Stats */}
        {!collapsed && (
          <div className="sidebar-section">
            <h3 className="section-title">Content Stats</h3>
            <div className="content-stats">
              <div className="stat-item">
                <span className="stat-label">Status</span>
                <span className="stat-value draft">Draft</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Created</span>
                <span className="stat-value">Today</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Last Edit</span>
                <span className="stat-value">2 minutes ago</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Views</span>
                <span className="stat-value">0</span>
              </div>
            </div>
          </div>
        )}

        {/* Help & Tips */}
        {!collapsed && (
          <div className="sidebar-section help-section">
            <h3 className="section-title">💡 Tips</h3>
            <div className="help-content">
              <div className="tip-item">
                <strong>Keyboard Shortcuts:</strong>
                <ul>
                  <li><kbd>Ctrl</kbd> + <kbd>S</kbd> - Save</li>
                  <li><kbd>Ctrl</kbd> + <kbd>P</kbd> - Preview</li>
                  <li><kbd>Ctrl</kbd> + <kbd>B</kbd> - Bold</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default ContentSidebar;