export function downloadCsv(filename, headers, rows) {
  const esc = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`
  const lines = [headers.map(esc).join(','), ...rows.map((row) => row.map(esc).join(','))]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
}
