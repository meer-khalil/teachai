import React from 'react';
import MetricCard from './components/MetricCard';
import ChartCard from './components/ChartCard';
import { formatNumber, formatPercentage } from '../../../utils/formatters';

const DashboardOverview = ({ data, timeRange, loading, onRefresh }) => {
  const { current = {}, changes = {} } = data;

  // Key metrics configuration
  const keyMetrics = [
    {
      title: 'Total Events',
      value: current.totalEvents || 0,
      change: changes.totalEvents || 0,
      format: 'number',
      icon: '📊',
      color: 'blue'
    },
    {
      title: 'Active Users',
      value: current.activeUsers || 0,
      change: changes.activeUsers || 0,
      format: 'number',
      icon: '👥',
      color: 'green'
    },
    {
      title: 'Page Views',
      value: current.pageViews || 0,
      change: changes.pageViews || 0,
      format: 'number',
      icon: '👁️',
      color: 'purple'
    },
    {
      title: 'AI Requests',
      value: current.aiRequests || 0,
      change: changes.aiRequests || 0,
      format: 'number',
      icon: '🤖',
      color: 'orange'
    },
    {
      title: 'Quiz Completions',
      value: current.quizCompletions || 0,
      change: changes.quizCompletions || 0,
      format: 'number',
      icon: '📝',
      color: 'teal'
    },
    {
      title: 'Chatbot Interactions',
      value: current.chatbotInteractions || 0,
      change: changes.chatbotInteractions || 0,
      format: 'number',
      icon: '💬',
      color: 'pink'
    }
  ];

  // Quick actions
  const quickActions = [
    {
      title: 'View User Analytics',
      icon: '👥',
      action: () => console.log('Navigate to user analytics')
    },
    {
      title: 'Content Performance',
      icon: '📊',
      action: () => console.log('Navigate to content analytics')
    },
    {
      title: 'System Performance',
      icon: '⚡',
      action: () => console.log('Navigate to performance')
    },
    {
      title: 'Export Report',
      icon: '📄',
      action: () => console.log('Export dashboard report')
    }
  ];

  if (loading && !current.totalEvents) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard overview...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-overview">
      {/* Summary Header */}
      <div className="overview-header">
        <div className="period-summary">
          <h2>
            Platform Overview 
            <span className="period-label">
              ({timeRange === '1d' ? 'Last 24 Hours' : 
                timeRange === '7d' ? 'Last 7 Days' :
                timeRange === '30d' ? 'Last 30 Days' : 'Last 90 Days'})
            </span>
          </h2>
          <button className="refresh-button" onClick={onRefresh} disabled={loading}>
            <span className={`refresh-icon ${loading ? 'spinning' : ''}`}>🔄</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        {keyMetrics.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            format={metric.format}
            icon={metric.icon}
            color={metric.color}
          />
        ))}
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="charts-grid">
          {/* Activity Trend Chart */}
          <ChartCard
            title="Activity Trend"
            type="line"
            data={{
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              datasets: [{
                label: 'Daily Events',
                data: [120, 190, 300, 500, 200, 300, 450],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4
              }]
            }}
            height={300}
          />

          {/* User Engagement Chart */}
          <ChartCard
            title="User Engagement"
            type="doughnut"
            data={{
              labels: ['Active Users', 'Casual Users', 'New Users'],
              datasets: [{
                data: [60, 25, 15],
                backgroundColor: [
                  '#10b981',
                  '#f59e0b',
                  '#3b82f6'
                ],
                borderWidth: 2
              }]
            }}
            height={300}
          />

          {/* Top Features Chart */}
          <ChartCard
            title="Popular Features"
            type="bar"
            data={{
              labels: ['Quiz', 'Chatbot', 'Lessons', 'AI Tools', 'Content'],
              datasets: [{
                label: 'Usage Count',
                data: [850, 720, 640, 580, 420],
                backgroundColor: [
                  '#8b5cf6',
                  '#f97316',
                  '#06b6d4',
                  '#84cc16',
                  '#f43f5e'
                ]
              }]
            }}
            height={300}
          />

          {/* Performance Overview */}
          <ChartCard
            title="System Health"
            type="gauge"
            data={{
              value: 92,
              max: 100,
              label: 'System Health Score',
              color: '#10b981'
            }}
            height={300}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          {quickActions.map((action, index) => (
            <button
              key={index}
              className="action-button"
              onClick={action.action}
            >
              <span className="action-icon">{action.icon}</span>
              <span className="action-title">{action.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      <div className="key-insights">
        <h3>Key Insights</h3>
        <div className="insights-grid">
          <div className="insight-card positive">
            <div className="insight-icon">📈</div>
            <div className="insight-content">
              <h4>User Growth</h4>
              <p>Active users increased by {Math.abs(changes.activeUsers || 12).toFixed(1)}% compared to previous period</p>
            </div>
          </div>

          <div className="insight-card neutral">
            <div className="insight-icon">🎯</div>
            <div className="insight-content">
              <h4>Feature Adoption</h4>
              <p>Quiz feature is the most popular with {formatNumber(current.quizCompletions)} completions</p>
            </div>
          </div>

          <div className="insight-card info">
            <div className="insight-icon">🤖</div>
            <div className="insight-content">
              <h4>AI Usage</h4>
              <p>AI services processed {formatNumber(current.aiRequests)} requests with high satisfaction</p>
            </div>
          </div>

          {changes.chatbotInteractions < -5 && (
            <div className="insight-card warning">
              <div className="insight-icon">⚠️</div>
              <div className="insight-content">
                <h4>Attention Needed</h4>
                <p>Chatbot interactions decreased by {Math.abs(changes.chatbotInteractions).toFixed(1)}%. Consider reviewing chatbot performance.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;