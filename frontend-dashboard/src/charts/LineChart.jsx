import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function LineChart({ labels, datasets, title, height = 300 }) {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

  const data = {
    labels,
    datasets: datasets.map((ds, i) => ({
      ...ds,
      borderColor: ds.color || COLORS[i % 4],
      backgroundColor: (ds.color || COLORS[i % 4]) + '20',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
    })),
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 12 }, usePointStyle: true, pointStyle: 'circle' },
      },
      title: title ? { display: true, text: title, font: { size: 14, weight: 'bold' } } : { display: false },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 } }, beginAtZero: true },
    },
  }

  return (
    <div style={{ height }}>
      <Line data={data} options={options} />
    </div>
  )
}
