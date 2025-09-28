import React from 'react';
import MetricCard from './components/MetricCard';
import ChartCard from './components/ChartCard';

const ContentAnalytics = ({ data, timeRange, loading, onRefresh }) => {
  const { pageViews = [], chatbots = [], quizzes = [], aiServices = [] } = data;

  // Content performance metrics
  const contentMetrics = [
    {
      title: 'Total Page Views',
      value: pageViews.reduce((sum, page) => sum + page.views, 0),
      icon: '👁️',
      color: 'blue'
    },
    {
      title: 'Unique Pages',
      value: pageViews.length,
      icon: '📄',
      color: 'green'
    },
    {
      title: 'Chatbot Interactions',
      value: chatbots.reduce((sum, bot) => sum + bot.interactions, 0),
      icon: '💬',
      color: 'purple'
    },
    {
      title: 'Quiz Completions',
      value: quizzes.reduce((sum, quiz) => sum + quiz.completions, 0),
      icon: '📝',
      color: 'orange'
    },
    {
      title: 'AI Service Requests',
      value: aiServices.reduce((sum, service) => sum + service.requests, 0),
      icon: '🤖',
      color: 'teal'
    },
    {
      title: 'Avg Quiz Score',
      value: quizzes.reduce((sum, quiz, _, arr) => sum + (quiz.avgScore || 0), 0) / (quizzes.length || 1),
      format: 'percentage',
      icon: '🎯',
      color: 'pink'
    }
  ];

  // Top pages chart data
  const topPagesData = {
    labels: pageViews.slice(0, 10).map(page => page.page.replace('/api/v1/', '').substring(0, 20)),
    datasets: [{
      label: 'Page Views',
      data: pageViews.slice(0, 10).map(page => page.views),
      backgroundColor: [
        '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444',
        '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
      ],
      borderWidth: 1
    }]
  };

  // Chatbot performance chart
  const chatbotData = {
    labels: chatbots.map(bot => bot._id || 'Unknown'),
    datasets: [{
      label: 'Interactions',
      data: chatbots.map(bot => bot.interactions),
      backgroundColor: 'rgba(139, 92, 246, 0.8)',
      borderColor: '#8b5cf6',
      borderWidth: 2
    }]
  };

  // Quiz performance chart
  const quizPerformanceData = {
    labels: quizzes.slice(0, 8).map((quiz, index) => `Quiz ${index + 1}`),
    datasets: [
      {
        label: 'Completions',
        data: quizzes.slice(0, 8).map(quiz => quiz.completions),
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderColor: '#f97316',
        borderWidth: 2,
        yAxisID: 'y'
      },
      {
        label: 'Avg Score (%)',
        data: quizzes.slice(0, 8).map(quiz => quiz.avgScore || 0),
        type: 'line',
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  // AI services usage chart
  const aiServicesData = {
    labels: aiServices.map(service => service._id || 'Unknown'),
    datasets: [{
      data: aiServices.map(service => service.requests),
      backgroundColor: [
        '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'
      ],
      borderWidth: 2
    }]
  };

  if (loading && pageViews.length === 0) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading content analytics...</p>
      </div>
    );
  }

  return (
    <div className="content-analytics">
      {/* Header */}
      <div className="analytics-header">
        <h2>Content Analytics</h2>
        <button className="refresh-button" onClick={onRefresh} disabled={loading}>
          <span className={`refresh-icon ${loading ? 'spinning' : ''}`}>🔄</span>
          Refresh
        </button>
      </div>

      {/* Content Metrics */}
      <div className="metrics-grid">
        {contentMetrics.map((metric, index) => (
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

      {/* Content Performance Charts */}
      <div className="charts-section">
        <div className="charts-grid">
          {/* Top Pages */}
          <ChartCard
            title="Most Viewed Pages"
            type="bar"
            data={topPagesData}
            height={300}
            options={{
              indexAxis: 'y',
              responsive: true,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                x: {
                  beginAtZero: true
                }
              }
            }}
          />

          {/* Chatbot Performance */}
          <ChartCard
            title="Chatbot Performance"
            type="doughnut"
            data={chatbotData}
            height={300}
            options={{
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }}
          />

          {/* Quiz Performance */}
          <ChartCard
            title="Quiz Performance"
            type="bar"
            data={quizPerformanceData}
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
                    text: 'Completions'
                  }
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  title: {
                    display: true,
                    text: 'Average Score (%)'
                  },
                  grid: {
                    drawOnChartArea: false,
                  },
                  max: 100
                }
              }
            }}
          />

          {/* AI Services Usage */}
          <ChartCard
            title="AI Services Usage"
            type="pie"
            data={aiServicesData}
            height={300}
            options={{
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }}
          />
        </div>
      </div>

      {/* Content Insights */}
      <div className="content-insights">
        <h3>Content Insights</h3>
        <div className="insights-grid">
          {/* Top Performing Content */}
          <div className="insight-card">
            <div className="insight-header">
              <span className="insight-icon">🏆</span>
              <h4>Top Performing Content</h4>
            </div>
            <div className="insight-content">
              {pageViews.slice(0, 3).map((page, index) => (
                <div key={index} className="top-content-item">
                  <div className="content-rank">{index + 1}</div>
                  <div className="content-info">
                    <div className="content-name">{page.page}</div>
                    <div className="content-views">{page.views} views</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chatbot Engagement */}
          <div className="insight-card">
            <div className="insight-header">
              <span className="insight-icon">💬</span>
              <h4>Chatbot Engagement</h4>
            </div>
            <div className="insight-content">
              <div className="chatbot-stats">
                <div className="stat-item">
                  <span className="stat-label">Most Popular:</span>
                  <span className="stat-value">{chatbots[0]?._id || 'N/A'}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Interactions:</span>
                  <span className="stat-value">{chatbots.reduce((sum, bot) => sum + bot.interactions, 0)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Avg per Chatbot:</span>
                  <span className="stat-value">
                    {chatbots.length > 0 ? 
                      Math.round(chatbots.reduce((sum, bot) => sum + bot.interactions, 0) / chatbots.length) : 
                      0
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quiz Performance */}
          <div className="insight-card">
            <div className="insight-header">
              <span className="insight-icon">📝</span>
              <h4>Quiz Performance</h4>
            </div>
            <div className="insight-content">
              <div className="quiz-stats">
                <div className="stat-item">
                  <span className="stat-label">Average Score:</span>
                  <span className="stat-value">
                    {quizzes.length > 0 ? 
                      `${(quizzes.reduce((sum, quiz) => sum + (quiz.avgScore || 0), 0) / quizzes.length).toFixed(1)}%` : 
                      '0%'
                    }
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Completions:</span>
                  <span className="stat-value">{quizzes.reduce((sum, quiz) => sum + quiz.completions, 0)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Quiz Count:</span>
                  <span className="stat-value">{quizzes.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Services */}
          <div className="insight-card">
            <div className="insight-header">
              <span className="insight-icon">🤖</span>
              <h4>AI Services</h4>
            </div>
            <div className="insight-content">
              <div className="ai-stats">
                <div className="stat-item">
                  <span className="stat-label">Most Used:</span>
                  <span className="stat-value">{aiServices[0]?._id || 'N/A'}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Requests:</span>
                  <span className="stat-value">{aiServices.reduce((sum, service) => sum + service.requests, 0)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Services Active:</span>
                  <span className="stat-value">{aiServices.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="detailed-tables">
        <div className="tables-grid">
          {/* Top Pages Table */}
          <div className="table-card">
            <h3>Top Pages</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Page</th>
                    <th>Views</th>
                    <th>Unique Views</th>
                  </tr>
                </thead>
                <tbody>
                  {pageViews.slice(0, 10).map((page, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td className="page-name">{page.page}</td>
                      <td>{page.views}</td>
                      <td>{page.uniqueViews || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quiz Details Table */}
          <div className="table-card">
            <h3>Quiz Performance</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Quiz</th>
                    <th>Completions</th>
                    <th>Avg Score</th>
                    <th>Unique Users</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.slice(0, 10).map((quiz, index) => (
                    <tr key={index}>
                      <td>Quiz {index + 1}</td>
                      <td>{quiz.completions}</td>
                      <td>
                        <span className={`score ${quiz.avgScore > 80 ? 'high' : quiz.avgScore > 60 ? 'medium' : 'low'}`}>
                          {quiz.avgScore?.toFixed(1) || 0}%
                        </span>
                      </td>
                      <td>{quiz.uniqueCompletions || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentAnalytics;