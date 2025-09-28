import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Activity,
  Database,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Server,
  Cpu,
  HardDrive,
  Gauge,
  Monitor,
  Globe,
  Users,
  BarChart3
} from 'lucide-react';

const PerformanceMonitor = () => {
  const [performanceData, setPerformanceData] = useState({
    cache: {
      hitRate: 85,
      totalKeys: 1240,
      memoryUsage: '256 MB',
      redisConnected: true
    },
    performance: {
      avgResponseTime: '124.50',
      slowRequests: 12,
      errorRate: '0.83',
      totalRequests: 5847,
      totalErrors: 48
    },
    recentResponseTimes: [],
    recentErrors: []
  });
  
  const [healthData, setHealthData] = useState({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: 0,
    memory: { used: 0, total: 0 },
    redis: { status: 'connected', latency: 0 },
    cache: { hitRate: 0, totalKeys: 0 }
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  // Fetch performance data
  const fetchPerformanceData = async () => {
    try {
      const response = await fetch('/api/v1/performance/stats');
      if (!response.ok) throw new Error('Failed to fetch performance data');
      
      const data = await response.json();
      setPerformanceData(data);
    } catch (err) {
      setError('Failed to load performance data');
      console.error('Performance data fetch error:', err);
    }
  };

  // Fetch health data
  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/v1/performance/health');
      if (!response.ok) throw new Error('Failed to fetch health data');
      
      const data = await response.json();
      setHealthData(data);
    } catch (err) {
      setError('Failed to load health data');
      console.error('Health data fetch error:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchPerformanceData(), fetchHealthData()]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Set up auto-refresh
    intervalRef.current = setInterval(() => {
      fetchPerformanceData();
      fetchHealthData();
    }, 30000); // Refresh every 30 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Format uptime
  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Format memory usage
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Status indicator component
  const StatusIndicator = ({ status, label }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'healthy':
        case 'connected':
          return 'text-green-500';
        case 'warning':
          return 'text-yellow-500';
        case 'error':
        case 'unhealthy':
          return 'text-red-500';
        default:
          return 'text-gray-500';
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'healthy':
        case 'connected':
          return <CheckCircle className="w-5 h-5" />;
        case 'warning':
          return <AlertTriangle className="w-5 h-5" />;
        case 'error':
        case 'unhealthy':
          return <AlertTriangle className="w-5 h-5" />;
        default:
          return <Activity className="w-5 h-5" />;
      }
    };

    return (
      <div className={`flex items-center space-x-2 ${getStatusColor(status)}`}>
        {getStatusIcon(status)}
        <span className="text-sm font-medium">{label}</span>
      </div>
    );
  };

  // Performance card component
  const PerformanceCard = ({ title, value, subtitle, icon: Icon, color = "blue" }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            {title}
          </h3>
          <p className={`text-2xl font-bold text-${color}-600 mt-2`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Performance Data</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Performance Monitor
          </h1>
          <p className="text-gray-600">
            Real-time performance metrics and system health monitoring
          </p>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-3">
              <StatusIndicator 
                status={healthData.status} 
                label={`System ${healthData.status}`} 
              />
              <StatusIndicator 
                status={healthData.redis.status} 
                label={`Redis ${healthData.redis.status}`} 
              />
              <div className="text-sm text-gray-600">
                Uptime: {formatUptime(healthData.uptime)}
              </div>
            </div>
          </div>

          <PerformanceCard
            title="Response Time"
            value={`${performanceData.performance.avgResponseTime}ms`}
            subtitle="Average response time"
            icon={Clock}
            color="blue"
          />

          <PerformanceCard
            title="Cache Hit Rate"
            value={`${performanceData.cache.hitRate}%`}
            subtitle={`${performanceData.cache.totalKeys} keys`}
            icon={Database}
            color="green"
          />

          <PerformanceCard
            title="Error Rate"
            value={`${performanceData.performance.errorRate}%`}
            subtitle={`${performanceData.performance.totalErrors} errors`}
            icon={AlertTriangle}
            color="red"
          />
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Response Time Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Response Time Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData.recentResponseTimes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value) => [`${value}ms`, 'Response Time']}
                />
                <Line 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Memory Usage */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              System Resources
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Memory Usage</span>
                  <span className="text-sm font-medium">
                    {formatBytes(healthData.memory.used)} / {formatBytes(healthData.memory.total)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(healthData.memory.used / healthData.memory.total) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Redis Latency</span>
                  <span className="text-sm font-medium">{healthData.redis.latency}ms</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Requests</span>
                  <span className="text-sm font-medium">
                    {performanceData.performance.totalRequests.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Errors */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Errors
            </h3>
            <div className="space-y-3">
              {performanceData.recentErrors.length > 0 ? (
                performanceData.recentErrors.map((error, index) => (
                  <div key={index} className="border-l-4 border-red-400 bg-red-50 p-3">
                    <p className="text-sm font-medium text-red-800">
                      {error.method} {error.url}
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      {error.error} - {new Date(error.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>No recent errors</p>
                </div>
              )}
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Performance Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Slow Requests</span>
                <span className="text-lg font-semibold text-orange-600">
                  {performanceData.performance.slowRequests}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Cache Memory</span>
                <span className="text-lg font-semibold text-blue-600">
                  {performanceData.cache.memoryUsage}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Redis Status</span>
                <span className={`text-lg font-semibold ${
                  performanceData.cache.redisConnected ? 'text-green-600' : 'text-red-600'
                }`}>
                  {performanceData.cache.redisConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          {/* Performance Tips */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Performance Tips
            </h3>
            <div className="space-y-3">
              <div className="border-l-4 border-blue-400 bg-blue-50 p-3">
                <p className="text-sm font-medium text-blue-800">
                  Cache Hit Rate: {performanceData.cache.hitRate}%
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {performanceData.cache.hitRate > 80 ? 'Excellent cache performance!' : 'Consider cache optimization'}
                </p>
              </div>
              
              <div className="border-l-4 border-yellow-400 bg-yellow-50 p-3">
                <p className="text-sm font-medium text-yellow-800">
                  Response Time
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  {parseFloat(performanceData.performance.avgResponseTime) < 200 
                    ? 'Great response times!' 
                    : 'Consider database query optimization'}
                </p>
              </div>
              
              <div className="border-l-4 border-green-400 bg-green-50 p-3">
                <p className="text-sm font-medium text-green-800">
                  Error Rate: {performanceData.performance.errorRate}%
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {parseFloat(performanceData.performance.errorRate) < 1 
                    ? 'Low error rate - system stable' 
                    : 'Monitor errors for patterns'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;