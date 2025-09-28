import React from 'react';
import MetricCard from './components/MetricCard';
import ChartCard from './components/ChartCard';
import { formatNumber, formatPercentage } from '../../../utils/formatters';

const UserAnalytics = ({ data, timeRange, loading, onRefresh }) => {
  const { overview = {}, retention = {}, segments = [] } = data;

  // User metrics
  const userMetrics = [
    {
      title: 'Total Users',
      value: overview.totalUsers || 0,
      icon: '👥',
      color: 'blue'
    },
    {
      title: 'New Users',
      value: overview.newUsers || 0,
      icon: '🆕',
      color: 'green'
    },
    {
      title: 'Active Users',
      value: overview.activeUsers || 0,
      icon: '🟢',
      color: 'emerald'
    },
    {
      title: 'Avg Events/User',
      value: overview.avgEventsPerUser || 0,
      format: 'decimal',
      icon: '📊',
      color: 'purple'
    },
    {
      title: 'Avg Sessions/User',
      value: overview.avgSessionsPerUser || 0,
      format: 'decimal',
      icon: '🔄',
      color: 'orange'
    }
  ];

  // Retention data for chart
  const retentionChartData = {
    labels: ['Day 1', 'Day 7', 'Day 30'],
    datasets: [{
      label: 'Retention Rate (%)',
      data: [retention.day1 || 0, retention.day7 || 0, retention.day30 || 0],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(168, 85, 247, 0.8)'
      ],
      borderColor: [
        '#22c55e',
        '#3b82f6',
        '#a855f7'
      ],
      borderWidth: 2
    }]
  };

  // User segments for pie chart
  const segmentsChartData = {
    labels: segments.map(segment => segment.name),
    datasets: [{
      data: segments.map(segment => segment.percentage),
      backgroundColor: [
        '#3b82f6', // Blue
        '#10b981', // Emerald  
        '#f59e0b', // Amber
        '#8b5cf6', // Violet
        '#ef4444'  // Red
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  // Sample user activity timeline data
  const activityTimelineData = {
    labels: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
    datasets: [{
      label: 'Active Users',
      data: [45, 23, 67, 189, 245, 298, 356, 287],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  if (loading && !overview.totalUsers) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading user analytics...</p>
      </div>
    );
  }

  return (
    <div className="user-analytics">
      {/* Header */}
      <div className="analytics-header">
        <h2>User Analytics</h2>
        <button className="refresh-button" onClick={onRefresh} disabled={loading}>
          <span className={`refresh-icon ${loading ? 'spinning' : ''}`}>🔄</span>
          Refresh
        </button>
      </div>

      {/* User Metrics */}
      <div className="metrics-grid">
        {userMetrics.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            format={metric.format}
            icon={metric.icon}
            color={metric.color}
          />
        ))}
      </div>

      {/* User Analysis Charts */}
      <div className="charts-section">
        <div className="charts-grid">
          {/* User Retention Chart */}
          <ChartCard
            title="User Retention"
            type="bar"
            data={retentionChartData}
            height={300}
            options={{
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    callback: function(value) {
                      return value + '%';
                    }
                  }
                }
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return context.parsed.y + '% retention';
                    }
                  }
                }
              }
            }}
          />

          {/* User Segments */}
          <ChartCard
            title="User Segments"
            type="doughnut"
            data={segmentsChartData}
            height={300}
            options={{
              plugins: {
                legend: {
                  position: 'bottom'
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const segment = segments[context.dataIndex];
                      return `${segment?.name}: ${segment?.count} users (${context.parsed}%)`;
                    }
                  }
                }
              }
            }}
          />

          {/* Daily Activity Pattern */}
          <ChartCard
            title="Daily Activity Pattern"
            type="line"
            data={activityTimelineData}
            height={300}
            options={{
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Time of Day'
                  }
                },
                y: {
                  title: {
                    display: true,
                    text: 'Active Users'
                  }
                }
              }
            }}
          />

          {/* User Growth Trend */}
          <ChartCard
            title="User Growth Trend"
            type="line"
            data={{
              labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
              datasets: [
                {
                  label: 'New Users',
                  data: [45, 67, 89, 123],
                  borderColor: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  tension: 0.4
                },
                {
                  label: 'Total Users',
                  data: [245, 312, 401, 524],
                  borderColor: '#3b82f6',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  tension: 0.4
                }
              ]
            }}
            height={300}
          />
        </div>
      </div>

      {/* User Insights */}
      <div className="user-insights">
        <h3>User Insights</h3>
        <div className="insights-grid">
          {/* Retention Insight */}
          <div className="insight-card">
            <div className="insight-header">
              <span className="insight-icon">🔄</span>
              <h4>Retention Performance</h4>
            </div>
            <div className="insight-content">
              <div className="retention-metrics">
                <div className="retention-metric">
                  <span className="metric-label">Day 1:</span>
                  <span className="metric-value">{retention.day1 || 0}%</span>
                  <span className={`trend ${(retention.day1 || 0) > 70 ? 'positive' : 'neutral'}`}>
                    {(retention.day1 || 0) > 70 ? '↗' : '→'}
                  </span>
                </div>
                <div className="retention-metric">
                  <span className="metric-label">Day 7:</span>
                  <span className="metric-value">{retention.day7 || 0}%</span>
                  <span className={`trend ${(retention.day7 || 0) > 40 ? 'positive' : 'neutral'}`}>
                    {(retention.day7 || 0) > 40 ? '↗' : '→'}
                  </span>
                </div>
                <div className="retention-metric">
                  <span className="metric-label">Day 30:</span>
                  <span className="metric-value">{retention.day30 || 0}%</span>
                  <span className={`trend ${(retention.day30 || 0) > 20 ? 'positive' : 'neutral'}`}>
                    {(retention.day30 || 0) > 20 ? '↗' : '→'}
                  </span>
                </div>
              </div>
              <p className="insight-description">
                {(retention.day7 || 0) > 50 ? 
                  'Strong 7-day retention indicates good user engagement' :
                  'Consider improving onboarding to boost early retention'
                }
              </p>
            </div>
          </div>

          {/* Peak Activity Insight */}
          <div className="insight-card">
            <div className="insight-header">
              <span className="insight-icon">⏰</span>
              <h4>Peak Activity</h4>
            </div>
            <div className="insight-content">
              <div className="peak-time">
                <span className="time-label">Most Active:</span>
                <span className="time-value">6:00 PM - 9:00 PM</span>
              </div>
              <p className="insight-description">
                Evening hours show highest user activity. Consider scheduling important updates during off-peak hours.
              </p>
            </div>
          </div>

          {/* User Segments Insight */}
          <div className="insight-card">
            <div className="insight-header">
              <span className="insight-icon">👥</span>
              <h4>User Segments</h4>
            </div>
            <div className="insight-content">
              <div className="segments-breakdown">
                {segments.slice(0, 3).map((segment, index) => (
                  <div key={index} className="segment-item">
                    <span className="segment-name">{segment.name}:</span>
                    <span className="segment-count">{segment.count} users</span>
                    <span className="segment-percentage">({segment.percentage}%)</span>
                  </div>
                ))}
              </div>
              <p className="insight-description">
                Focus on converting casual users to regular users through targeted engagement campaigns.
              </p>
            </div>
          </div>

          {/* Engagement Quality */}
          <div className="insight-card">
            <div className="insight-header">
              <span className="insight-icon">🎯</span>
              <h4>Engagement Quality</h4>
            </div>
            <div className="insight-content">
              <div className="engagement-metrics">
                <div className="engagement-metric">
                  <span className="metric-label">Avg Sessions:</span>
                  <span className="metric-value">{(overview.avgSessionsPerUser || 0).toFixed(1)}</span>
                </div>
                <div className="engagement-metric">
                  <span className="metric-label">Avg Events:</span>
                  <span className="metric-value">{(overview.avgEventsPerUser || 0).toFixed(1)}</span>
                </div>
              </div>
              <p className="insight-description">
                {(overview.avgEventsPerUser || 0) > 10 ? 
                  'High user engagement with platform features' :
                  'Users could benefit from better feature discovery'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Users Table */}
      <div className="top-users-section">
        <h3>Most Active Users (Last {timeRange})</h3>
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>User</th>
                <th>Events</th>
                <th>Sessions</th>
                <th>Last Active</th>
                <th>Engagement Score</th>
              </tr>
            </thead>
            <tbody>
              {/* Sample data - in real app, this would come from API */}
              <tr>
                <td>1</td>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">👩‍🏫</div>
                    <span>Sarah Johnson</span>
                  </div>
                </td>
                <td>247</td>
                <td>15</td>
                <td>2 hours ago</td>
                <td><span className="score high">95</span></td>
              </tr>
              <tr>
                <td>2</td>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">👨‍🎓</div>
                    <span>Mike Chen</span>
                  </div>
                </td>
                <td>189</td>
                <td>12</td>
                <td>5 hours ago</td>
                <td><span className="score high">87</span></td>
              </tr>
              <tr>
                <td>3</td>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">👩‍🎓</div>
                    <span>Emily Davis</span>
                  </div>
                </td>
                <td>156</td>
                <td>10</td>
                <td>1 day ago</td>
                <td><span className="score medium">74</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserAnalytics;