import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const { getDashboardAnalytics, getRealTimeAnalytics, loading } = useAnalytics();
  const [dashboardData, setDashboardData] = useState(null);
  const [realTimeData, setRealTimeData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('day');
  const [selectedMetric, setSelectedMetric] = useState('users');
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    loadDashboardData();
    loadRealTimeData();
    
    // Set up auto-refresh for real-time data
    const interval = setInterval(loadRealTimeData, 30000); // Refresh every 30 seconds
    setRefreshInterval(interval);
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      const data = await getDashboardAnalytics({ 
        period: selectedPeriod,
        metrics: 'all'
      });
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const loadRealTimeData = async () => {
    try {
      const data = await getRealTimeAnalytics();
      setRealTimeData(data);
    } catch (error) {
      console.error('Error loading real-time data:', error);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <span className="trend-up">↗ +{trend.toFixed(1)}%</span>;
    if (trend < 0) return <span className="trend-down">↘ {trend.toFixed(1)}%</span>;
    return <span className="trend-neutral">→ 0%</span>;
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

  if (loading && !dashboardData) {
    return (
      <div className="analytics-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Analytics Dashboard</h1>
          <p>Track your platform's performance and user engagement</p>
        </div>
        <div className="dashboard-controls">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-selector"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
          <button onClick={loadDashboardData} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Real-time Metrics */}
      {realTimeData && (
        <div className="realtime-section">
          <h2>Real-time Activity</h2>
          <div className="realtime-cards">
            <div className="realtime-card">
              <div className="card-icon">👥</div>
              <div className="card-content">
                <h3>{realTimeData.metrics.activeUsers}</h3>
                <p>Active Users</p>
              </div>
            </div>
            <div className="realtime-card">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <h3>{realTimeData.metrics.sessionsLastHour}</h3>
                <p>Sessions (Last Hour)</p>
              </div>
            </div>
            <div className="realtime-card">
              <div className="card-icon">🔥</div>
              <div className="card-content">
                <h3>{realTimeData.metrics.interactionsLastHour}</h3>
                <p>Interactions</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      {dashboardData && (
        <>
          <div className="overview-section">
            <h2>Overview</h2>
            <div className="overview-cards">
              <div className="overview-card">
                <div className="card-header">
                  <h3>Total Users</h3>
                  {getTrendIcon(dashboardData.overview.trends.users)}
                </div>
                <div className="card-value">
                  {formatNumber(dashboardData.overview.totals.users.total)}
                </div>
                <div className="card-subtitle">
                  {formatNumber(dashboardData.overview.totals.users.active)} active
                </div>
              </div>

              <div className="overview-card">
                <div className="card-header">
                  <h3>Content Views</h3>
                  {getTrendIcon(dashboardData.overview.trends.content)}
                </div>
                <div className="card-value">
                  {formatNumber(dashboardData.overview.totals.content.views)}
                </div>
                <div className="card-subtitle">
                  {formatNumber(dashboardData.overview.totals.content.created)} created
                </div>
              </div>

              <div className="overview-card">
                <div className="card-header">
                  <h3>Revenue</h3>
                  {getTrendIcon(dashboardData.overview.trends.revenue)}
                </div>
                <div className="card-value">
                  ${formatNumber(dashboardData.overview.totals.revenue.total)}
                </div>
                <div className="card-subtitle">
                  This {selectedPeriod}
                </div>
              </div>

              <div className="overview-card">
                <div className="card-header">
                  <h3>Engagement</h3>
                </div>
                <div className="card-value">
                  {dashboardData.overview.totals.users.active > 0 
                    ? ((dashboardData.overview.totals.content.views / dashboardData.overview.totals.users.active).toFixed(1))
                    : '0'
                  }
                </div>
                <div className="card-subtitle">
                  Avg views per user
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-section">
            <div className="chart-container">
              <div className="chart-header">
                <h3>User Activity Trend</h3>
                <select 
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="metric-selector"
                >
                  <option value="users">Users</option>
                  <option value="content">Content</option>
                  <option value="revenue">Revenue</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData.timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value) => [formatNumber(value), selectedMetric]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={`${selectedMetric}.total`}
                    stroke={COLORS[0]}
                    fill={COLORS[0]}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <div className="chart-header">
                <h3>Top Content</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.topContent.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="contentId.title" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="views.total" fill={COLORS[1]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Feature Usage */}
          <div className="feature-usage-section">
            <h3>Feature Usage</h3>
            <div className="feature-grid">
              {Object.entries(dashboardData.featureUsage).map(([feature, usage], index) => (
                <div key={feature} className="feature-card">
                  <div className="feature-header">
                    <h4>{feature.replace('_', ' ').toUpperCase()}</h4>
                    <span className="usage-count">{formatNumber(usage)}</span>
                  </div>
                  <div className="feature-bar">
                    <div 
                      className="feature-progress"
                      style={{
                        width: `${Math.min((usage / Math.max(...Object.values(dashboardData.featureUsage))) * 100, 100)}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          {realTimeData && realTimeData.recentActivity && (
            <div className="recent-activity-section">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                {realTimeData.recentActivity.slice(0, 10).map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-avatar">
                      {activity.userId?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="activity-content">
                      <p className="activity-user">{activity.userId?.name || 'Anonymous User'}</p>
                      <p className="activity-action">
                        Started session • {activity.interactions.length} interactions
                      </p>
                      <p className="activity-time">
                        {new Date(activity.sessionData.startTime).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="activity-device">
                      {activity.sessionData.device.type === 'mobile' ? '📱' : '💻'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;