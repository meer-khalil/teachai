// Number formatting utilities

export const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }

  const absNum = Math.abs(num);
  
  if (absNum >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  } else if (absNum >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (absNum >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  } else {
    return Math.round(num).toString();
  }
};

export const formatPercentage = (num, decimals = 1) => {
  if (num === null || num === undefined || isNaN(num)) {
    return '0%';
  }
  return `${num.toFixed(decimals)}%`;
};

export const formatMilliseconds = (ms) => {
  if (ms === null || ms === undefined || isNaN(ms)) {
    return '0ms';
  }

  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    return `${Math.round(ms)}ms`;
  }
};

export const formatBytes = (bytes) => {
  if (bytes === null || bytes === undefined || isNaN(bytes)) {
    return '0 B';
  }

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  
  if (bytes === 0) return '0 B';
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  
  return `${size} ${sizes[i]}`;
};

export const formatDuration = (seconds) => {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return '0s';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
};

export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDate = (date, options = {}) => {
  if (!date) return '';

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };

  return new Date(date).toLocaleDateString('en-US', defaultOptions);
};

export const formatDateTime = (date, options = {}) => {
  if (!date) return '';

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };

  return new Date(date).toLocaleString('en-US', defaultOptions);
};

export const formatRelativeTime = (date) => {
  if (!date) return '';

  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now - targetDate) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(date);
  }
};

export const formatScore = (score, maxScore = 100) => {
  if (score === null || score === undefined || isNaN(score)) {
    return '0%';
  }

  const percentage = (score / maxScore) * 100;
  return `${Math.round(percentage)}%`;
};

export const formatGrade = (score, maxScore = 100) => {
  if (score === null || score === undefined || isNaN(score)) {
    return 'F';
  }

  const percentage = (score / maxScore) * 100;

  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
};

export const formatRating = (rating, maxRating = 5) => {
  if (rating === null || rating === undefined || isNaN(rating)) {
    return '0.0';
  }

  return `${rating.toFixed(1)}/${maxRating}`;
};

export const formatChangeIndicator = (current, previous) => {
  if (!previous || previous === 0) {
    return { value: 0, direction: 'neutral', formatted: '0%' };
  }

  const change = ((current - previous) / previous) * 100;
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
  
  return {
    value: change,
    direction,
    formatted: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
  };
};

// Chart.js color palettes
export const chartColors = {
  primary: [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ef4444', // red
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#ec4899', // pink
    '#6366f1'  // indigo
  ],
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  neutral: '#6b7280'
};

// Generate chart color with opacity
export const withOpacity = (color, opacity = 0.8) => {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

// Format trend direction
export const formatTrend = (value, previousValue) => {
  if (!previousValue || previousValue === 0) {
    return { direction: 'neutral', icon: '→', class: 'neutral' };
  }

  const change = value - previousValue;
  
  if (change > 0) {
    return { direction: 'up', icon: '↗', class: 'positive' };
  } else if (change < 0) {
    return { direction: 'down', icon: '↘', class: 'negative' };
  } else {
    return { direction: 'neutral', icon: '→', class: 'neutral' };
  }
};

// Health status formatter
export const formatHealthStatus = (score) => {
  if (score >= 90) return { status: 'excellent', color: '#10b981', label: 'Excellent' };
  if (score >= 80) return { status: 'good', color: '#84cc16', label: 'Good' };
  if (score >= 70) return { status: 'fair', color: '#f59e0b', label: 'Fair' };
  if (score >= 60) return { status: 'poor', color: '#f97316', label: 'Poor' };
  return { status: 'critical', color: '#ef4444', label: 'Critical' };
};

// Engagement level formatter
export const formatEngagementLevel = (score) => {
  if (score >= 80) return { level: 'high', color: '#10b981', label: 'High' };
  if (score >= 60) return { level: 'medium', color: '#f59e0b', label: 'Medium' };
  if (score >= 40) return { level: 'low', color: '#f97316', label: 'Low' };
  return { level: 'very-low', color: '#ef4444', label: 'Very Low' };
};

// Format learning streak
export const formatLearningStreak = (days) => {
  if (days === 0) return 'No streak';
  if (days === 1) return '1 day streak';
  if (days < 7) return `${days} day streak`;
  if (days < 30) return `${Math.floor(days / 7)} week streak`;
  return `${Math.floor(days / 30)} month streak`;
};

// Default export with all formatters
export default {
  formatNumber,
  formatPercentage,
  formatMilliseconds,
  formatBytes,
  formatDuration,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatScore,
  formatGrade,
  formatRating,
  formatChangeIndicator,
  formatTrend,
  formatHealthStatus,
  formatEngagementLevel,
  formatLearningStreak,
  chartColors,
  withOpacity
};