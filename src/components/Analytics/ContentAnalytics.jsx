import React, { useState, useEffect } from 'react';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import './ContentAnalytics.css';

const ContentAnalytics = ({ contentId, contentTitle }) => {
  const { getContentAnalytics, loading } = useAnalytics();
  const [contentAnalytics, setContentAnalytics] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState('30d');

  useEffect(() => {
    if (contentId) {
      loadContentAnalytics();
    }
  }, [contentId, selectedDateRange]);

  const loadContentAnalytics = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedDateRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      const data = await getContentAnalytics(contentId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      setContentAnalytics(data);
    } catch (error) {
      console.error('Error loading content analytics:', error);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const calculateEngagementRate = () => {
    if (!contentAnalytics) return 0;
    const totalViews = contentAnalytics.analytics.views.total;
    const totalEngagements = 
      contentAnalytics.analytics.engagement.likes + 
      contentAnalytics.analytics.engagement.shares + 
      contentAnalytics.analytics.engagement.comments;
    
    return totalViews > 0 ? ((totalEngagements / totalViews) * 100).toFixed(1) : 0;
  };

  const getViewsData = () => {
    if (!contentAnalytics?.analytics.views.daily) return [];
    
    return contentAnalytics.analytics.views.daily
      .filter(day => {
        const dayDate = new Date(day.date);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(selectedDateRange));
        return dayDate >= cutoffDate;
      })
      .map(day => ({
        date: new Date(day.date).toLocaleDateString(),
        views: day.count,
        unique: day.unique || 0
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getTopReferrers = () => {
    if (!contentAnalytics?.analytics.sources) return [];
    
    return Object.entries(contentAnalytics.analytics.sources)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getDeviceBreakdown = () => {
    if (!contentAnalytics?.analytics.devices) return [];
    
    const total = Object.values(contentAnalytics.analytics.devices).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(contentAnalytics.analytics.devices)
      .map(([device, count]) => ({
        device: device.charAt(0).toUpperCase() + device.slice(1),
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count);
  };

  if (loading) {
    return (
      <div className="content-analytics">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading content analytics...</p>
        </div>
      </div>
    );
  }

  if (!contentAnalytics) {
    return (
      <div className="content-analytics">
        <div className="no-data">
          <h3>No Analytics Data</h3>
          <p>No analytics data found for this content.</p>
        </div>
      </div>
    );
  }

  const viewsData = getViewsData();
  const topReferrers = getTopReferrers();
  const deviceBreakdown = getDeviceBreakdown();

  return (
    <div className="content-analytics">
      <div className="analytics-header">
        <div className="header-content">
          <h2>Content Analytics</h2>
          {contentTitle && <p>{contentTitle}</p>}
        </div>
        <div className="analytics-controls">
          <select 
            value={selectedDateRange} 
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="date-range-selector"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="overview-cards">
        <div className="overview-card">
          <div className="card-icon">👁️</div>
          <div className="card-content">
            <h3>{formatNumber(contentAnalytics.analytics.views.total)}</h3>
            <p>Total Views</p>
            <span className="card-subtitle">
              {formatNumber(contentAnalytics.analytics.views.unique)} unique
            </span>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-icon">💙</div>
          <div className="card-content">
            <h3>{formatNumber(contentAnalytics.analytics.engagement.likes)}</h3>
            <p>Likes</p>
            <span className="card-subtitle">
              +{formatNumber(contentAnalytics.analytics.engagement.shares)} shares
            </span>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-icon">💬</div>
          <div className="card-content">
            <h3>{formatNumber(contentAnalytics.analytics.engagement.comments)}</h3>
            <p>Comments</p>
            <span className="card-subtitle">
              {formatNumber(contentAnalytics.analytics.engagement.downloads)} downloads
            </span>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>{calculateEngagementRate()}%</h3>
            <p>Engagement Rate</p>
            <span className="card-subtitle">
              {formatDuration(contentAnalytics.analytics.engagement.averageTimeSpent)} avg time
            </span>
          </div>
        </div>
      </div>

      {/* Views Chart */}
      <div className="chart-section">
        <h3>Views Over Time</h3>
        <div className="views-chart">
          {viewsData.length > 0 ? (
            <div className="chart-bars">
              {viewsData.map((day, index) => (
                <div key={index} className="chart-bar">
                  <div 
                    className="bar"
                    style={{ 
                      height: `${(day.views / Math.max(...viewsData.map(d => d.views))) * 100}%` 
                    }}
                    title={`${day.views} views on ${day.date}`}
                  ></div>
                  <span className="bar-label">{day.date.split('/')[1]}/{day.date.split('/')[2]}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-chart-data">No view data available for the selected period</p>
          )}
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="engagement-section">
        <h3>Engagement Metrics</h3>
        <div className="engagement-grid">
          <div className="engagement-metric">
            <h4>Average Time Spent</h4>
            <p>{formatDuration(contentAnalytics.analytics.engagement.averageTimeSpent)}</p>
          </div>
          <div className="engagement-metric">
            <h4>Scroll Depth</h4>
            <p>{Math.round(contentAnalytics.analytics.engagement.scrollDepth.average)}%</p>
          </div>
          <div className="engagement-metric">
            <h4>Bounce Rate</h4>
            <p>{Math.round(contentAnalytics.analytics.engagement.bounceRate)}%</p>
          </div>
          <div className="engagement-metric">
            <h4>Return Rate</h4>
            <p>{Math.round(contentAnalytics.analytics.engagement.returnRate)}%</p>
          </div>
        </div>
      </div>

      {/* Traffic Sources & Device Breakdown */}
      <div className="insights-grid">
        <div className="insight-card">
          <h3>Top Traffic Sources</h3>
          <div className="sources-list">
            {topReferrers.length > 0 ? (
              topReferrers.map((referrer, index) => (
                <div key={index} className="source-item">
                  <span className="source-name">{referrer.source || 'Direct'}</span>
                  <span className="source-count">{formatNumber(referrer.count)}</span>
                </div>
              ))
            ) : (
              <p className="no-data-text">No traffic source data available</p>
            )}
          </div>
        </div>

        <div className="insight-card">
          <h3>Device Breakdown</h3>
          <div className="device-list">
            {deviceBreakdown.length > 0 ? (
              deviceBreakdown.map((device, index) => (
                <div key={index} className="device-item">
                  <div className="device-info">
                    <span className="device-name">{device.device}</span>
                    <span className="device-percentage">{device.percentage}%</span>
                  </div>
                  <div className="device-bar">
                    <div 
                      className="device-progress"
                      style={{ width: `${device.percentage}%` }}
                    ></div>
                  </div>
                  <span className="device-count">{formatNumber(device.count)} views</span>
                </div>
              ))
            ) : (
              <p className="no-data-text">No device data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="performance-section">
        <h3>Performance Insights</h3>
        <div className="insights-cards">
          <div className="insight-item">
            <div className="insight-icon">🚀</div>
            <div className="insight-content">
              <h4>Load Performance</h4>
              <p>Average: {formatDuration(contentAnalytics.analytics.performance.averageLoadTime / 1000)}</p>
              <small>Page load speed impact on user experience</small>
            </div>
          </div>
          
          <div className="insight-item">
            <div className="insight-icon">📱</div>
            <div className="insight-content">
              <h4>Mobile Optimization</h4>
              <p>
                {deviceBreakdown.find(d => d.device === 'Mobile')?.percentage || 0}% mobile traffic
              </p>
              <small>Mobile users engagement pattern</small>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-icon">🔄</div>
            <div className="insight-content">
              <h4>User Retention</h4>
              <p>{Math.round(contentAnalytics.analytics.engagement.returnRate)}% return</p>
              <small>Users coming back to this content</small>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-icon">⭐</div>
            <div className="insight-content">
              <h4>Content Quality Score</h4>
              <p>
                {Math.round(
                  (contentAnalytics.analytics.engagement.averageTimeSpent / 60) * 10 + 
                  (contentAnalytics.analytics.engagement.scrollDepth.average / 10)
                )}
              </p>
              <small>Based on time spent and scroll depth</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentAnalytics;