import React, { useState, useEffect } from 'react';
import './AnalyticsDashboard.css';
import DashboardOverview from './DashboardOverview';
import UserAnalytics from './UserAnalytics';
import ContentAnalytics from './ContentAnalytics';
import PerformanceAnalytics from './PerformanceAnalytics';
import RealtimeMetrics from './RealtimeMetrics';
import { fetchAnalyticsData } from '../../../utils/analyticsApi';

const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({});
  const [error, setError] = useState(null);

  // Time range options
  const timeRangeOptions = [
    { value: '1d', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' }
  ];

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'content', label: 'Content', icon: '📝' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'realtime', label: 'Real-time', icon: '🔴' }
  ];

  // Load analytics data
  const loadAnalyticsData = async (tab = activeTab, range = timeRange) => {
    try {
      setLoading(true);
      setError(null);

      let endpoint = '';
      switch (tab) {
        case 'overview':
          endpoint = 'dashboard';
          break;
        case 'users':
          endpoint = 'users';
          break;
        case 'content':
          endpoint = 'content';
          break;
        case 'performance':
          endpoint = 'performance';
          break;
        case 'realtime':
          endpoint = 'performance';
          range = '1h'; // Real-time uses shorter range
          break;
        default:
          endpoint = 'dashboard';
      }

      const result = await fetchAnalyticsData(endpoint, { range });
      
      setData(prevData => ({
        ...prevData,
        [tab]: result.data
      }));

    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Initial data load and setup refresh intervals
  useEffect(() => {
    loadAnalyticsData();

    // Set up auto-refresh for real-time data
    let refreshInterval;
    if (activeTab === 'realtime') {
      refreshInterval = setInterval(() => {
        loadAnalyticsData('realtime');
      }, 30000); // Refresh every 30 seconds for real-time
    } else {
      // Refresh other tabs every 5 minutes
      refreshInterval = setInterval(() => {
        loadAnalyticsData();
      }, 300000);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [activeTab]);

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (!data[tabId]) {
      loadAnalyticsData(tabId);
    }
  };

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    loadAnalyticsData(activeTab, range);
  };

  // Render active tab content
  const renderTabContent = () => {
    const tabData = data[activeTab] || {};

    switch (activeTab) {
      case 'overview':
        return (
          <DashboardOverview 
            data={tabData} 
            timeRange={timeRange}
            loading={loading}
            onRefresh={() => loadAnalyticsData('overview')}
          />
        );
      case 'users':
        return (
          <UserAnalytics 
            data={tabData} 
            timeRange={timeRange}
            loading={loading}
            onRefresh={() => loadAnalyticsData('users')}
          />
        );
      case 'content':
        return (
          <ContentAnalytics 
            data={tabData} 
            timeRange={timeRange}
            loading={loading}
            onRefresh={() => loadAnalyticsData('content')}
          />
        );
      case 'performance':
        return (
          <PerformanceAnalytics 
            data={tabData} 
            timeRange={timeRange}
            loading={loading}
            onRefresh={() => loadAnalyticsData('performance')}
          />
        );
      case 'realtime':
        return (
          <RealtimeMetrics 
            data={tabData} 
            loading={loading}
            onRefresh={() => loadAnalyticsData('realtime')}
          />
        );
      default:
        return <div>Select a tab to view analytics</div>;
    }
  };

  return (
    <div className="analytics-dashboard">
      {/* Dashboard Header */}
      <div className="analytics-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            <span className="title-icon">📊</span>
            Analytics Dashboard
          </h1>
          <p className="dashboard-subtitle">
            Comprehensive insights into your TeachAI platform performance
          </p>
        </div>

        {/* Time Range Selector */}
        {activeTab !== 'realtime' && (
          <div className="time-range-selector">
            <label>Time Range:</label>
            <select 
              value={timeRange} 
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className="time-range-select"
            >
              {timeRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="analytics-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            {loading && activeTab === tab.id && (
              <span className="loading-indicator">⟳</span>
            )}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
            <button 
              className="retry-button"
              onClick={() => loadAnalyticsData()}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>

      {/* Footer */}
      <div className="analytics-footer">
        <div className="footer-content">
          <p>
            Last updated: {new Date().toLocaleString()}
            {activeTab === 'realtime' && (
              <span className="live-indicator">
                <span className="live-dot"></span>
                Live
              </span>
            )}
          </p>
          <div className="footer-actions">
            <button 
              className="export-button"
              onClick={() => {
                // TODO: Implement export functionality
                console.log('Export analytics data');
              }}
            >
              📊 Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;