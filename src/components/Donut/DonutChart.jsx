
import React from 'react';
import { Doughnut } from 'react-chartjs-2';

import { Chart, ArcElement } from 'chart.js'
import { useEffect } from 'react';
Chart.register(ArcElement);


const DonutChart = ({ data }) => {

  useEffect(() => {
    console.log('data: ', data);


  }, [])

  const chartData = {
    labels: data.map(item => item.label),
    datasets: [{
      data: data.map(item => item.percentage),
      backgroundColor: ['green', 'red'],
    }],
  };

  return (
    <div>
      <Doughnut data={chartData} />
    </div>
  );
};

export default DonutChart