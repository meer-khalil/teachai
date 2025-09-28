import React, { useState, useEffect } from 'react';
import MetricCard from './components/MetricCard';
import ChartCard from './components/ChartCard';

const RealtimeMetrics = ({ data, loading, onRefresh }) => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const { realtime = {}, systemHealth = {} } = data;

  // Update timestamp when data changes
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setLastUpdate(new Date());
    }
  }, [data]);

  // Real-time metrics
  const realtimeMetrics = [
    {
      title: 'Active Users',
      value: realtime.activeUsers || 0,
      icon: '👥',
      color: 'green',
      trend: 'up' // This would come from comparing with previous values
    },
    {
      title: 'Active Sessions',
      value: realtime.activeSessions || 0,
      icon: '🔗',
      color: 'blue'
    },
    {
      title: 'Requests/Min',
      value: Math.floor(Math.random() * 100) + 50, // Mock real-time data
      icon: '📊',
      color: 'purple'
    },
    {
      title: 'Response Time',
      value: systemHealth.avgResponseTime || 0,
      format: 'milliseconds',
      icon: '⚡',
      color: 'orange'
    },
    {
      title: 'Error Rate',
      value: systemHealth.errorRate || 0,
      format: 'percentage',
      icon: '❌',
      color: 'red'
    },
    {
      title: 'System Load',
      value: systemHealth.cpuUsage || 0,
      format: 'percentage',
      icon: '💻',
      color: 'teal'
    }
  ];

  // Live activity feed data (mock)
  const liveActivity = [
    { time: '2 sec ago', event: 'User completed quiz', user: 'Sarah J.', icon: '📝' },
    { time: '5 sec ago', event: 'New user registration', user: 'Mike C.', icon: '👤' },
    { time: '8 sec ago', event: 'Chatbot interaction', user: 'Emily R.', icon: '💬' },
    { time: '12 sec ago', event: 'AI request processed', user: 'John D.', icon: '🤖' },
    { time: '15 sec ago', event: 'Lesson completed', user: 'Lisa K.', icon: '📚' },
    { time: '18 sec ago', event: 'File uploaded', user: 'Alex M.', icon: '📁' },
    { time: '22 sec ago', event: 'Quiz started', user: 'David B.', icon: '▶️' },
    { time: '25 sec ago', event: 'User logged in', user: 'Anna S.', icon: '🔐' }
  ];

  // Real-time chart data (updating every few seconds)
  const [chartData, setChartData] = useState({
    labels: Array.from({length: 20}, (_, i) => `${19-i}s ago`),
    datasets: [
      {
        label: 'Active Users',
        data: Array.from({length: 20}, () => Math.floor(Math.random() * 50) + 30),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Requests/sec',
        data: Array.from({length: 20}, () => Math.floor(Math.random() * 20) + 5),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  });

  // Update chart data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prevData => ({
        ...prevData,
        datasets: prevData.datasets.map(dataset => ({
          ...dataset,
          data: [
            ...dataset.data.slice(1),
            dataset.label === 'Active Users' ? 
              Math.floor(Math.random() * 50) + 30 : 
              Math.floor(Math.random() * 20) + 5
          ]
        }))
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // System health gauge data
  const healthGaugeData = {
    value: Math.round((100 - (systemHealth.cpuUsage || 0) * 0.5 - (systemHealth.errorRate || 0) * 10)),
    max: 100,
    label: 'System Health',
    color: '#10b981'
  };

  // Geographic distribution (mock data)
  const geographicData = {
    labels: ['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania'],
    datasets: [{
      data: [45, 25, 20, 6, 3, 1],
      backgroundColor: [
        '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'
      ]
    }]
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading real-time metrics...</p>
      </div>
    );
  }

  return (
    <div className="realtime-metrics">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-content">
          <h2>
            <span className="live-indicator">
              <span className="live-dot pulsing"></span>
              Live
            </span>
            Real-time Metrics
          </h2>
          <p className="last-update">Last updated: {lastUpdate.toLocaleTimeString()}</p>
        </div>
        <button className="refresh-button" onClick={onRefresh} disabled={loading}>
          <span className={`refresh-icon ${loading ? 'spinning' : ''}`}>🔄</span>
          Refresh
        </button>
      </div>

      {/* Real-time Metrics Grid */}
      <div className="metrics-grid">
        {realtimeMetrics.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            format={metric.format}
            icon={metric.icon}
            color={metric.color}
            trend={metric.trend}
            isRealtime={true}
          />
        ))}
      </div>

      {/* Live Dashboard */}
      <div className="live-dashboard">
        <div className="dashboard-grid">
          {/* Live Activity Chart */}
          <div className="chart-container live-chart">
            <ChartCard
              title="Live Activity (Last 40 seconds)"
              type="line"
              data={chartData}
              height={300}
              options={{
                responsive: true,
                animation: {
                  duration: 0
                },
                plugins: {
                  legend: {
                    position: 'top'
                  }
                },
                scales: {
                  x: {
                    display: false
                  },
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>

          {/* System Health Gauge */}
          <div className="gauge-container">
            <ChartCard
              title="System Health Score"
              type="gauge"
              data={healthGaugeData}
              height={300}
            />
          </div>

          {/* Geographic Distribution */}
          <div className="geo-container">
            <ChartCard
              title="User Distribution"
              type="doughnut"
              data={geographicData}
              height={300}
              options={{
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      boxWidth: 12
                    }
                  }
                }
              }}
            />
          </div>

          {/* Live Activity Feed */}
          <div className="activity-feed">
            <div className="feed-header">
              <h3>
                <span className="feed-icon">📈</span>
                Live Activity Feed
              </h3>
              <div className="activity-count">
                <span className="count-number">{liveActivity.length}</span>
                <span className="count-label">recent events</span>
              </div>
            </div>
            <div className="feed-content">
              {liveActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">{activity.icon}</div>
                  <div className="activity-details">
                    <div className="activity-event">{activity.event}</div>
                    <div className="activity-meta">
                      <span className="activity-user">{activity.user}</span>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Current Status Cards */}
      <div className="status-cards">
        <div className="status-grid">
          {/* Server Status */}
          <div className="status-card healthy">
            <div className="status-header">
              <span className="status-icon">🖥️</span>
              <h4>Server Status</h4>
              <span className="status-badge healthy">Online</span>
            </div>
            <div className="status-details">
              <div className="detail-item">
                <span className="detail-label">Uptime:</span>
                <span className="detail-value">99.9%</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Load:</span>
                <span className="detail-value">{(systemHealth.cpuUsage || 0).toFixed(1)}%</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Memory:</span>
                <span className="detail-value">{(systemHealth.memoryUsage || 0).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Database Status */}
          <div className="status-card healthy">
            <div className="status-header">
              <span className="status-icon">🗄️</span>
              <h4>Database Status</h4>
              <span className="status-badge healthy">Connected</span>
            </div>
            <div className="status-details">
              <div className="detail-item">
                <span className="detail-label">Connections:</span>
                <span className="detail-value">{systemHealth.activeConnections || 0}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Queries/sec:</span>
                <span className="detail-value">{Math.floor(Math.random() * 50) + 10}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Avg Query:</span>
                <span className="detail-value">{Math.floor(Math.random() * 20) + 5}ms</span>
              </div>
            </div>
          </div>

          {/* API Status */}
          <div className="status-card healthy">
            <div className="status-header">
              <span className="status-icon">🔌</span>
              <h4>API Status</h4>
              <span className="status-badge healthy">Active</span>
            </div>
            <div className="status-details">
              <div className="detail-item">
                <span className="detail-label">Response Time:</span>
                <span className="detail-value">{Math.floor(systemHealth.avgResponseTime || 150)}ms</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Error Rate:</span>
                <span className="detail-value">{(systemHealth.errorRate || 0).toFixed(2)}%</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Requests:</span>
                <span className="detail-value">{Math.floor(Math.random() * 100) + 200}/min</span>
              </div>
            </div>
          </div>

          {/* AI Services Status */}
          <div className="status-card healthy">
            <div className="status-header">
              <span className="status-icon">🤖</span>
              <h4>AI Services</h4>
              <span className="status-badge healthy">Running</span>
            </div>
            <div className="status-details">
              <div className="detail-item">
                <span className="detail-label">Active Models:</span>
                <span className="detail-value">8</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Queue:</span>
                <span className="detail-value">{Math.floor(Math.random() * 10)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Processing:</span>
                <span className="detail-value">{Math.floor(Math.random() * 50) + 20}/min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert and Notifications */}
      <div className="alerts-section">
        <h3>System Alerts</h3>
        <div className="alerts-container">
          {systemHealth.errorRate > 5 ? (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <div className="alert-content">
                <div className="alert-title">High Error Rate Detected</div>
                <div className="alert-message">Current error rate is {systemHealth.errorRate.toFixed(2)}%. This is above the normal threshold.</div>
              </div>
            </div>
          ) : null}
          
          {systemHealth.cpuUsage > 80 ? (
            <div className="alert alert-warning">
              <span className="alert-icon">🔥</span>
              <div className="alert-content">
                <div className="alert-title">High CPU Usage</div>
                <div className="alert-message">CPU usage is at {systemHealth.cpuUsage.toFixed(1)}%. Consider scaling if this persists.</div>
              </div>
            </div>
          ) : null}

          {realtime.activeUsers > 1000 ? (
            <div className="alert alert-info">
              <span className="alert-icon">🎉</span>
              <div className="alert-content">
                <div className="alert-title">High User Activity</div>
                <div className="alert-message">Currently {realtime.activeUsers} active users online - above average!</div>
              </div>
            </div>
          ) : null}

          {/* Default success message if no alerts */}
          {systemHealth.errorRate <= 5 && systemHealth.cpuUsage <= 80 && (
            <div className="alert alert-success">
              <span className="alert-icon">✅</span>
              <div className="alert-content">
                <div className="alert-title">All Systems Operational</div>
                <div className="alert-message">All services are running normally with no detected issues.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealtimeMetrics;