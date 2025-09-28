import React, { useState, useEffect } from 'react';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './UserAnalytics.css';

const UserAnalytics = ({ userId }) => {
  const { getUserAnalytics, loading } = useAnalytics();
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('interactions');

  useEffect(() => {
    if (userId) {
      loadUserAnalytics();
    }
  }, [userId, dateRange]);

  const loadUserAnalytics = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '1d':
          startDate.setDate(startDate.getDate() - 1);
          break;
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
          startDate.setDate(startDate.getDate() - 7);
      }

      const data = await getUserAnalytics(userId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100
      });
      
      setUserAnalytics(data);
    } catch (error) {
      console.error('Error loading user analytics:', error);
    }
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getSessionData = () => {
    if (!userAnalytics?.analytics) return [];
    
    return userAnalytics.analytics.map((session, index) => ({
      session: `Session ${index + 1}`,
      interactions: session.interactions.length,
      duration: session.sessionData.duration || 0,
      activeTime: session.engagement.activeTime || 0,
      scrollDepth: session.engagement.scrollDepth || 0,
      clicks: session.engagement.clickCount || 0,
      date: new Date(session.sessionData.startTime).toLocaleDateString()
    }));
  };

  const getTopFeatures = () => {
    if (!userAnalytics?.summary?.featureUsage) return [];
    
    return Object.entries(userAnalytics.summary.featureUsage)
      .map(([feature, data]) => ({
        feature: feature.replace('_', ' ').toUpperCase(),
        frequency: data.frequency,
        used: data.used
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  };

  const getInteractionTypes = () => {
    if (!userAnalytics?.analytics) return [];
    
    const interactionCounts = {};
    
    userAnalytics.analytics.forEach(session => {
      session.interactions.forEach(interaction => {
        interactionCounts[interaction.type] = (interactionCounts[interaction.type] || 0) + 1;
      });
    });
    
    return Object.entries(interactionCounts)
      .map(([type, count]) => ({
        type: type.replace('_', ' ').toUpperCase(),
        count
      }))
      .sort((a, b) => b.count - a.count);
  };

  if (loading) {
    return (
      <div className="user-analytics">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading user analytics...</p>
        </div>
      </div>
    );
  }

  if (!userAnalytics) {
    return (
      <div className="user-analytics">
        <div className="no-data">
          <h3>No Analytics Data</h3>
          <p>No analytics data found for this user.</p>
        </div>
      </div>
    );
  }

  const sessionData = getSessionData();
  const topFeatures = getTopFeatures();
  const interactionTypes = getInteractionTypes();

  return (
    <div className="user-analytics">
      <div className="analytics-header">
        <div className="header-content">
          <h2>User Analytics</h2>
          <p>Detailed insights into user behavior and engagement</p>
        </div>
        <div className="analytics-controls">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="date-range-selector"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>{userAnalytics.summary.totalSessions}</h3>
            <p>Total Sessions</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">🎯</div>
          <div className="card-content">
            <h3>{userAnalytics.summary.totalInteractions}</h3>
            <p>Total Interactions</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">⏱️</div>
          <div className="card-content">
            <h3>{formatDuration(userAnalytics.summary.averageSessionDuration)}</h3>
            <p>Avg Session Duration</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">🖱️</div>
          <div className="card-content">
            <h3>{userAnalytics.summary.engagementMetrics.totalClicks}</h3>
            <p>Total Clicks</p>
          </div>
        </div>
      </div>

      {/* Session Activity Chart */}
      <div className="chart-section">
        <div className="chart-header">
          <h3>Session Activity</h3>
          <select 
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="metric-selector"
          >
            <option value="interactions">Interactions</option>
            <option value="duration">Duration</option>
            <option value="activeTime">Active Time</option>
            <option value="clicks">Clicks</option>
          </select>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sessionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="session" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [
                  selectedMetric === 'duration' || selectedMetric === 'activeTime' 
                    ? formatDuration(value) 
                    : value,
                  selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)
                ]}
              />
              <Bar dataKey={selectedMetric} fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature Usage and Interaction Types */}
      <div className="insights-grid">
        <div className="insight-card">
          <h3>Top Features Used</h3>
          <div className="feature-list">
            {topFeatures.map((feature, index) => (
              <div key={index} className="feature-item">
                <div className="feature-info">
                  <span className="feature-name">{feature.feature}</span>
                  <span className="feature-stats">
                    Used {feature.used} times • {feature.frequency} frequency
                  </span>
                </div>
                <div className="feature-bar">
                  <div 
                    className="feature-progress"
                    style={{
                      width: `${(feature.frequency / Math.max(...topFeatures.map(f => f.frequency))) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="insight-card">
          <h3>Interaction Types</h3>
          <div className="interaction-list">
            {interactionTypes.map((interaction, index) => (
              <div key={index} className="interaction-item">
                <span className="interaction-type">{interaction.type}</span>
                <span className="interaction-count">{interaction.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="engagement-section">
        <h3>Engagement Metrics</h3>
        <div className="engagement-grid">
          <div className="engagement-metric">
            <h4>Active Time</h4>
            <p>{formatDuration(userAnalytics.summary.engagementMetrics.totalActiveTime)}</p>
            <small>Total time actively using the platform</small>
          </div>
          <div className="engagement-metric">
            <h4>Average Scroll Depth</h4>
            <p>{Math.round(userAnalytics.summary.engagementMetrics.averageScrollDepth)}%</p>
            <small>How far users typically scroll</small>
          </div>
          <div className="engagement-metric">
            <h4>Interactions per Session</h4>
            <p>
              {userAnalytics.summary.totalSessions > 0 
                ? Math.round(userAnalytics.summary.totalInteractions / userAnalytics.summary.totalSessions)
                : 0
              }
            </p>
            <small>Average interactions per session</small>
          </div>
          <div className="engagement-metric">
            <h4>Session Frequency</h4>
            <p>
              {dateRange === '7d' ? Math.round(userAnalytics.summary.totalSessions / 7) :
               dateRange === '30d' ? Math.round(userAnalytics.summary.totalSessions / 30) :
               dateRange === '90d' ? Math.round(userAnalytics.summary.totalSessions / 90) :
               userAnalytics.summary.totalSessions
              }
            </p>
            <small>Sessions per day</small>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="recent-sessions">
        <h3>Recent Sessions</h3>
        <div className="sessions-list">
          {userAnalytics.analytics.slice(0, 5).map((session, index) => (
            <div key={index} className="session-item">
              <div className="session-header">
                <div className="session-info">
                  <span className="session-date">
                    {new Date(session.sessionData.startTime).toLocaleString()}
                  </span>
                  <span className="session-device">
                    {session.sessionData.device.type === 'mobile' ? '📱' : '💻'} {session.sessionData.device.type}
                  </span>
                </div>
                <span className="session-duration">
                  {formatDuration(session.sessionData.duration || 0)}
                </span>
              </div>
              <div className="session-stats">
                <span>{session.interactions.length} interactions</span>
                <span>{Math.round(session.engagement.scrollDepth || 0)}% scroll depth</span>
                <span>{session.engagement.clickCount || 0} clicks</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserAnalytics;