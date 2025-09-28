import React from 'react';
import { formatNumber, formatPercentage, formatMilliseconds } from '../../../../utils/formatters';

const MetricCard = ({ 
  title, 
  value, 
  change, 
  format = 'number', 
  icon, 
  color = 'blue', 
  trend,
  isRealtime = false 
}) => {
  const formatValue = (val, fmt) => {
    switch (fmt) {
      case 'percentage':
        return formatPercentage(val);
      case 'milliseconds':
        return formatMilliseconds(val);
      case 'decimal':
        return val.toFixed(1);
      default:
        return formatNumber(val);
    }
  };

  const getChangeIcon = (changeValue) => {
    if (!changeValue) return null;
    if (changeValue > 0) return '↗️';
    if (changeValue < 0) return '↘️';
    return '→';
  };

  const getChangeClass = (changeValue) => {
    if (!changeValue) return 'neutral';
    if (changeValue > 0) return 'positive';
    if (changeValue < 0) return 'negative';
    return 'neutral';
  };

  const getTrendClass = () => {
    if (trend === 'up') return 'trending-up';
    if (trend === 'down') return 'trending-down';
    return '';
  };

  return (
    <div className={`metric-card color-${color} ${isRealtime ? 'realtime' : ''} ${getTrendClass()}`}>
      {isRealtime && (
        <div className="realtime-indicator">
          <span className="pulse-dot"></span>
          LIVE
        </div>
      )}
      
      <div className="metric-header">
        <div className="metric-icon">{icon}</div>
        <div className="metric-title">{title}</div>
      </div>
      
      <div className="metric-value">
        {formatValue(value, format)}
      </div>
      
      {change !== undefined && (
        <div className={`metric-change ${getChangeClass(change)}`}>
          <span className="change-icon">{getChangeIcon(change)}</span>
          <span className="change-value">
            {Math.abs(change).toFixed(1)}%
          </span>
          <span className="change-period">vs last period</span>
        </div>
      )}
      
      {trend && (
        <div className="metric-trend">
          <div className="trend-indicator">
            {trend === 'up' && <span className="trend-arrow up">▲</span>}
            {trend === 'down' && <span className="trend-arrow down">▼</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricCard;