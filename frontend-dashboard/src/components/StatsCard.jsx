export default function StatsCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }) {
  const colorMap = {
    blue: { bg: 'bg-blue-50', icon: 'bg-blue-500', text: 'text-blue-600' },
    green: { bg: 'bg-emerald-50', icon: 'bg-emerald-500', text: 'text-emerald-600' },
    yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-500', text: 'text-yellow-600' },
    red: { bg: 'bg-red-50', icon: 'bg-red-500', text: 'text-red-600' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-500', text: 'text-purple-600' },
    indigo: { bg: 'bg-indigo-50', icon: 'bg-indigo-500', text: 'text-indigo-600' },
  }
  const c = colorMap[color] || colorMap.blue

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start gap-4 fade-in`}>
      <div className={`${c.icon} p-3 rounded-lg flex-shrink-0`}>
        {Icon && <Icon className="w-5 h-5 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        {trend !== undefined && (
          <p className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% dari kemarin
          </p>
        )}
      </div>
    </div>
  )
}
