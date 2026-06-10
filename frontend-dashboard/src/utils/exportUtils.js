// ============================================================
// EXPORT UTILITIES
// ============================================================

export function exportToCSV(data, filename = 'export') {
  if (!data || data.length === 0) return

  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h] === null || row[h] === undefined ? '' : String(row[h])
        return `"${val.replace(/"/g, '""')}"`
      }).join(',')
    )
  ]

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportToJSON(data, filename = 'export') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.json`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Mock PDF export (in real app use jsPDF or react-pdf)
export function exportToPDF(title = 'Laporan RADMS') {
  alert(`Ekspor PDF: "${title}"\n\n(Fitur ini memerlukan library jsPDF pada implementasi produksi)`)
}

// Mock Excel export
export function exportToExcel(data, filename = 'export') {
  // For demo purposes, export as CSV with .xlsx extension hint
  exportToCSV(data, filename)
  // In production, use SheetJS (xlsx library)
}
