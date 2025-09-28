import React from 'react';
import MetricCard from './components/MetricCard';
import ChartCard from './components/ChartCard';

const PerformanceAnalytics = ({ data, timeRange, loading, onRefresh }) => {
  const { responseTime = [], errors = [], systemHealth = {}, realtime = {} } = data;

  // Performance metrics
  const performanceMetrics = [
    {
      title: 'Avg Response Time',
      value: systemHealth.avgResponseTime || 0,
      format: 'milliseconds',
      icon: '⚡',
      color: 'blue'
    },
    {
      title: 'Error Rate',
      value: systemHealth.errorRate || 0,
      format: 'percentage',
      icon: '❌',
      color: 'red'
    },
    {
      title: 'Active Connections',
      value: systemHealth.activeConnections || 0,
      icon: '🔗',
      color: 'green'
    },
    {
      title: 'CPU Usage',
      value: systemHealth.cpuUsage || 0,
      format: 'percentage',
      icon: '💻',
      color: 'orange'
    },
    {
      title: 'Memory Usage',
      value: systemHealth.memoryUsage || 0,
      format: 'percentage',
      icon: '🧠',
      color: 'purple'
    },
    {
      title: 'System Health',
      value: calculateHealthScore(systemHealth),
      format: 'percentage',
      icon: '💚',
      color: 'emerald'
    }
  ];

  // Response time chart data
  const responseTimeData = {
    labels: responseTime.slice(0, 10).map(item => item._id?.substring(0, 15) || 'Unknown'),
    datasets: [
      {
        label: 'Avg Response Time (ms)',
        data: responseTime.slice(0, 10).map(item => item.avgResponseTime),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: '#3b82f6',
        borderWidth: 2
      },
      {
        label: 'Max Response Time (ms)',
        data: responseTime.slice(0, 10).map(item => item.maxResponseTime),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: '#ef4444',
        borderWidth: 2
      }
    ]
  };

  // Error distribution chart
  const errorDistributionData = {
    labels: errors.map(error => error._id || 'Unknown'),
    datasets: [{
      data: errors.map(error => error.count),
      backgroundColor: [
        '#ef4444', '#f97316', '#eab308', '#84cc16', '#10b981'
      ],
      borderWidth: 2
    }]
  };

  // System health timeline (mock data for demonstration)
  const healthTimelineData = {
    labels: Array.from({length: 24}, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'CPU Usage (%)',
        data: Array.from({length: 24}, () => Math.random() * 100),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4
      },
      {
        label: 'Memory Usage (%)',
        data: Array.from({length: 24}, () => Math.random() * 80 + 10),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Response Time (ms)',
        data: Array.from({length: 24}, () => Math.random() * 200 + 50),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  // Endpoint performance chart
  const endpointPerformanceData = {
    labels: responseTime.slice(0, 8).map(item => item._id?.replace('/api/v1/', '') || 'Unknown'),
    datasets: [
      {
        label: 'Request Count',
        data: responseTime.slice(0, 8).map(item => item.requestCount),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: '#10b981',
        borderWidth: 2,
        yAxisID: 'y'
      },
      {
        label: 'Error Rate (%)',
        data: responseTime.slice(0, 8).map(item => item.errorRate || 0),
        type: 'line',
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  function calculateHealthScore(health) {
    if (!health || Object.keys(health).length === 0) return 0;
    
    const cpuScore = Math.max(0, 100 - (health.cpuUsage || 0));
    const memoryScore = Math.max(0, 100 - (health.memoryUsage || 0));
    const errorScore = Math.max(0, 100 - (health.errorRate || 0) * 10);
    const responseScore = Math.max(0, 100 - Math.min(100, (health.avgResponseTime || 0) / 10));
    
    return Math.round((cpuScore + memoryScore + errorScore + responseScore) / 4);
  }

  if (loading && responseTime.length === 0) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading performance analytics...</p>
      </div>
    );
  }

  return (
    <div className="performance-analytics">
      {/* Header */}
      <div className="analytics-header">
        <h2>Performance Analytics</h2>
        <button className="refresh-button" onClick={onRefresh} disabled={loading}>
          <span className={`refresh-icon ${loading ? 'spinning' : ''}`}>🔄</span>
          Refresh
        </button>
      </div>

      {/* Performance Metrics */}
      <div className="metrics-grid">
        {performanceMetrics.map((metric, index) => (
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

      {/* System Health Status */}
      <div className="health-status">
        <div className="status-header">
          <h3>System Health Status</h3>
          <div className={`health-indicator ${calculateHealthScore(systemHealth) > 80 ? 'healthy' : calculateHealthScore(systemHealth) > 60 ? 'warning' : 'critical'}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {calculateHealthScore(systemHealth) > 80 ? 'Healthy' : 
               calculateHealthScore(systemHealth) > 60 ? 'Warning' : 'Critical'}
            </span>
          </div>
        </div>
        
        <div className="health-details">
          <div className="health-item">
            <span className="health-label">Uptime:</span>
            <span className="health-value">99.9%</span>
          </div>
          <div className="health-item">
            <span className="health-label">Last Restart:</span>
            <span className="health-value">3 days ago</span>
          </div>
          <div className="health-item">
            <span className="health-label">Active Sessions:</span>
            <span className="health-value">{realtime.activeSessions || 0}</span>
          </div>
          <div className="health-item">
            <span className="health-label">Total Requests:</span>
            <span className="health-value">{responseTime.reduce((sum, item) => sum + (item.requestCount || 0), 0)}</span>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="charts-section">
        <div className="charts-grid">
          {/* Response Time Chart */}
          <ChartCard
            title="Response Time by Endpoint"
            type="bar"
            data={responseTimeData}
            height={300}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top'
                }
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Endpoints'
                  }
                },
                y: {
                  title: {
                    display: true,
                    text: 'Response Time (ms)'
                  }
                }
              }
            }}
          />

          {/* Error Distribution */}
          <ChartCard
            title="Error Distribution"
            type="doughnut"
            data={errorDistributionData}
            height={300}
            options={{
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }}
          />

          {/* System Health Timeline */}
          <ChartCard
            title="System Health Timeline (24h)"
            type="line"
            data={healthTimelineData}
            height={300}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top'
                }
              },
              scales: {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  title: {
                    display: true,
                    text: 'Percentage (%)'
                  },
                  max: 100
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  title: {
                    display: true,
                    text: 'Response Time (ms)'
                  },
                  grid: {
                    drawOnChartArea: false,
                  },
                  max: 500
                }
              }
            }}
          />

          {/* Endpoint Performance */}
          <ChartCard
            title="Endpoint Performance vs Error Rate"
            type="bar"
            data={endpointPerformanceData}
            height={300}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top'
                }
              },
              scales: {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  title: {
                    display: true,
                    text: 'Request Count'
                  }
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  title: {
                    display: true,
                    text: 'Error Rate (%)'
                  },
                  grid: {
                    drawOnChartArea: false,
                  },
                  max: 100
                }
              }
            }}
          />
        </div>
      </div>

      {/* Performance Insights */}
      <div className="performance-insights">
        <h3>Performance Insights</h3>
        <div className="insights-grid">
          {/* Response Time Insight */}
          <div className="insight-card">
            <div className="insight-header">
              <span className="insight-icon">⚡</span>
              <h4>Response Time Analysis</h4>
            </div>
            <div className="insight-content">
              <div className="response-stats">
                <div className="stat-item">
                  <span className="stat-label">Fastest Endpoint:</span>
                  <span className="stat-value">
                    {responseTime.length > 0 ? 
                      responseTime.reduce((min, item) => 
                        (item.avgResponseTime || Infinity) < (min.avgResponseTime || Infinity) ? item : min
                      )._id?.substring(0, 20) || 'N/A' : 'N/A'
                    }
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Slowest Endpoint:</span>
                  <span className="stat-value">
                    {responseTime.length > 0 ? 
                      responseTime.reduce((max, item) => 
                        (item.avgResponseTime || 0) > (max.avgResponseTime || 0) ? item : max
                      )._id?.substring(0, 20) || 'N/A' : 'N/A'
                    }
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Overall Average:</span>
                  <span className="stat-value">
                    {responseTime.length > 0 ? 
                      Math.round(responseTime.reduce((sum, item) => sum + (item.avgResponseTime || 0), 0) / responseTime.length) : 0
                    }ms
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Analysis */}
          <div className="insight-card">
            <div className="insight-header">
              <span className="insight-icon">❌</span>
              <h4>Error Analysis</h4>
            </div>
            <div className="insight-content">
              <div className="error-stats">
                <div className="stat-item">
                  <span className="stat-label">Most Common Error:</span>
                  <span className="stat-value">{errors[0]?._id || 'None'}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Errors:</span>
                  <span className="stat-value">{errors.reduce((sum, error) => sum + error.count, 0)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Error Types:</span>
                  <span className="stat-value">{errors.length}</span>
                </div>
              </div>
              <p className="insight-description">
                {systemHealth.errorRate < 1 ? 
                  'Excellent error rate - system is performing well' :
                  systemHealth.errorRate < 5 ?
                  'Good error rate - monitor for trends' :
                  'High error rate - immediate attention required'
                }
              </p>
            </div>
          </div>

          {/* Resource Usage */}
          <div className="insight-card">
            <div className="insight-header">
              <span className="insight-icon">📊</span>
              <h4>Resource Usage</h4>
            </div>
            <div className="insight-content">
              <div className="resource-bars">
                <div className="resource-item">
                  <span className="resource-label">CPU</span>
                  <div className="resource-bar">
                    <div 
                      className="resource-fill cpu" 
                      style={{width: `${systemHealth.cpuUsage || 0}%`}}
                    ></div>
                  </div>
                  <span className="resource-value">{(systemHealth.cpuUsage || 0).toFixed(1)}%</span>
                </div>
                <div className="resource-item">
                  <span className="resource-label">Memory</span>
                  <div className="resource-bar">
                    <div 
                      className="resource-fill memory" 
                      style={{width: `${systemHealth.memoryUsage || 0}%`}}
                    ></div>
                  </div>
                  <span className="resource-value">{(systemHealth.memoryUsage || 0).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="insight-card">
            <div className="insight-header">
              <span className="insight-icon">💡</span>
              <h4>Recommendations</h4>
            </div>
            <div className="insight-content">
              <ul className="recommendations-list">
                {systemHealth.avgResponseTime > 500 && (
                  <li>Consider optimizing slow endpoints to improve response times</li>
                )}
                {systemHealth.errorRate > 5 && (
                  <li>Investigate and fix recurring errors to improve reliability</li>
                )}
                {systemHealth.cpuUsage > 80 && (
                  <li>CPU usage is high - consider scaling or optimizing processes</li>
                )}
                {systemHealth.memoryUsage > 80 && (
                  <li>Memory usage is high - check for memory leaks or increase capacity</li>
                )}
                {systemHealth.avgResponseTime <= 200 && systemHealth.errorRate < 2 && (
                  <li>System performance is excellent - maintain current optimization</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Performance Table */}
      <div className="performance-table">
        <h3>Endpoint Performance Details</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Requests</th>
                <th>Avg Response</th>
                <th>Max Response</th>
                <th>Min Response</th>
                <th>Error Rate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {responseTime.slice(0, 15).map((item, index) => (
                <tr key={index}>
                  <td className="endpoint-name">{item._id || 'Unknown'}</td>
                  <td>{item.requestCount || 0}</td>
                  <td>{item.avgResponseTime?.toFixed(0) || 0}ms</td>
                  <td>{item.maxResponseTime || 0}ms</td>
                  <td>{item.minResponseTime || 0}ms</td>
                  <td>
                    <span className={`error-rate ${(item.errorRate || 0) > 5 ? 'high' : (item.errorRate || 0) > 2 ? 'medium' : 'low'}`}>
                      {(item.errorRate || 0).toFixed(1)}%
                    </span>
                  </td>
                  <td>
                    <span className={`status ${(item.avgResponseTime || 0) < 200 ? 'excellent' : (item.avgResponseTime || 0) < 500 ? 'good' : 'slow'}`}>
                      {(item.avgResponseTime || 0) < 200 ? 'Excellent' : 
                       (item.avgResponseTime || 0) < 500 ? 'Good' : 'Slow'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;