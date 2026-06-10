import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function BarChart({ labels, datasets, title, height = 300 }) {
  const data = {
    labels,
    datasets: datasets.map((ds, i) => ({
      ...ds,
      backgroundColor: ds.color || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][i % 4],
      borderRadius: 6,
      borderSkipped: false,
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
      <Bar data={data} options={options} />
    </div>
  )
}
