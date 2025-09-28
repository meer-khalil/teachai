import React, { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const ChartCard = ({ 
  title, 
  type, 
  data, 
  options = {}, 
  height = 300,
  loading = false 
}) => {
  const chartRef = useRef(null);

  // Default options for all chart types
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#333',
        borderWidth: 1,
        cornerRadius: 6,
        caretPadding: 10,
      },
    },
    scales: type === 'line' || type === 'bar' ? {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        beginAtZero: true,
      },
    } : undefined,
  };

  // Merge default options with provided options
  const chartOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options.plugins,
    },
  };

  // Special handling for gauge chart (custom implementation)
  const renderGaugeChart = () => {
    const { value, max, label, color } = data;
    const percentage = (value / max) * 100;
    const rotation = (percentage / 100) * 180 - 90;

    return (
      <div className="gauge-chart">
        <div className="gauge-container">
          <div className="gauge-background">
            <div 
              className="gauge-fill" 
              style={{ 
                transform: `rotate(${rotation}deg)`,
                borderColor: color 
              }}
            />
            <div className="gauge-center">
              <div className="gauge-value">{value}</div>
              <div className="gauge-label">{label}</div>
            </div>
          </div>
          <div className="gauge-scale">
            <span className="scale-min">0</span>
            <span className="scale-max">{max}</span>
          </div>
        </div>
      </div>
    );
  };

  // Render appropriate chart type
  const renderChart = () => {
    if (loading) {
      return (
        <div className="chart-loading">
          <div className="loading-spinner small"></div>
          <p>Loading chart...</p>
        </div>
      );
    }

    if (type === 'gauge') {
      return renderGaugeChart();
    }

    const ChartComponent = {
      line: Line,
      bar: Bar,
      doughnut: Doughnut,
      pie: Pie,
    }[type];

    if (!ChartComponent) {
      return <div className="chart-error">Unsupported chart type: {type}</div>;
    }

    return (
      <ChartComponent
        ref={chartRef}
        data={data}
        options={chartOptions}
      />
    );
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
        <div className="chart-actions">
          <button 
            className="chart-action-btn"
            title="Download Chart"
            onClick={() => {
              if (chartRef.current) {
                const url = chartRef.current.toBase64Image();
                const link = document.createElement('a');
                link.download = `${title.replace(/\s+/g, '_').toLowerCase()}.png`;
                link.href = url;
                link.click();
              }
            }}
          >
            📥
          </button>
        </div>
      </div>
      
      <div className="chart-content" style={{ height: `${height}px` }}>
        {renderChart()}
      </div>
    </div>
  );
};

export default ChartCard;