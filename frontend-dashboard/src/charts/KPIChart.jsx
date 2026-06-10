import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function KPIChart({ kpiData, height = 400 }) {
  const labels = kpiData.map(d => d.driverName.split(' ').slice(0, 2).join(' '))

  const data = {
    labels,
    datasets: [
      {
        label: 'Kehadiran (20%)',
        data: kpiData.map(d => d.attendance),
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Kepatuhan Antrian (20%)',
        data: kpiData.map(d => d.queueCompliance),
        backgroundColor: '#10b981',
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Aktivitas Jemput (30%)',
        data: kpiData.map(d => d.pickupActivity),
        backgroundColor: '#f59e0b',
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Waktu Respon (20%)',
        data: kpiData.map(d => d.responseTime),
        backgroundColor: '#8b5cf6',
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 11 }, usePointStyle: true, pointStyle: 'circle' },
      },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, maxRotation: 45 },
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 11 } },
        min: 0,
        max: 100,
      },
    },
  }

  return (
    <div style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  )
}
