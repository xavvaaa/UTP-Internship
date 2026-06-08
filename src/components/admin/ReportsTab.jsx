import { Download, FileSpreadsheet, FileText, RefreshCw } from 'lucide-react'
import { downloadCsv } from '../../utils/csvExport'
import { downloadReportDocx, downloadReportPdf, downloadReportXlsx } from '../../utils/reportExport'
import styles from './ReportsTab.module.css'

export default function ReportsTab({ orders, menuItems = [], summary, onRefresh }) {
  const report = buildReport({ orders, menuItems, summary })

  function exportCsv() {
    downloadCsv(
      `${report.fileBaseName}.csv`,
      ['Order ID', 'Seat', 'Meal', 'Drink', 'Dessert', 'Snack', 'Notes', 'Status'],
      orders.map((o) => [
        o.orderId,
        o.seatNumber,
        o.meal,
        o.drink,
        o.dessert,
        o.snack ?? '',
        o.notes ?? '',
        o.status,
      ]),
    )
  }

  return (
    <section className={styles.wrap}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Analytics and decision support</p>
          <h2 className={styles.heroTitle}>Flight meal report</h2>
          <p className={styles.heroText}>
            Monitor meal trends, passenger preferences, and demand patterns to guide inventory planning and
            improve cabin operations.
          </p>
        </div>
        <div className={styles.heroActions}>
          {onRefresh ? (
            <button type="button" className={styles.secondaryButton} onClick={onRefresh}>
              <RefreshCw size={16} />
              Refresh
            </button>
          ) : null}
          <button type="button" className={styles.exportButton} onClick={() => downloadReportPdf(report)}>
            <Download size={16} />
            PDF
          </button>
          <button type="button" className={styles.exportButton} onClick={() => downloadReportDocx(report)}>
            <FileText size={16} />
            DOCX
          </button>
          <button type="button" className={styles.exportButton} onClick={() => downloadReportXlsx(report)}>
            <FileSpreadsheet size={16} />
            XLSX
          </button>
          <button type="button" className={styles.secondaryButton} onClick={exportCsv}>
            CSV
          </button>
        </div>
      </div>

      <div className={styles.summaryGrid} aria-label="Report summary">
        <Metric label="Total Orders" value={report.metrics.totalOrders} />
        <Metric label="Completion Rate" value={`${report.metrics.completionRate}%`} tone="delivered" />
        <Metric label="Top Meal" value={report.metrics.topMeal || 'N/A'} />
        <Metric label="Top Add-on" value={report.metrics.topAddon || 'N/A'} />
      </div>

      <div className={styles.panelGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h3>Demand by meal</h3>
              <p>Highest requested meals for inventory planning.</p>
            </div>
          </div>
          <Chart rows={report.mealRows} emptyLabel="No meal demand yet." />
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h3>Passenger preferences</h3>
              <p>Selections across meal add-on categories.</p>
            </div>
          </div>
          <Chart rows={report.categoryRows} emptyLabel="No preferences recorded yet." />
        </section>
      </div>

      <div className={styles.panelGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h3>Status flow</h3>
              <p>Operational workload by order status.</p>
            </div>
          </div>
          <Chart rows={report.statusRows} emptyLabel="No order statuses yet." />
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h3>Planning insights</h3>
              <p>Decision-support notes generated from current demand.</p>
            </div>
          </div>
          <ul className={styles.insightList}>
            {report.insights.map((insight) => (
              <li key={insight}>{insight}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h3>Inventory planning</h3>
            <p>Demand compared with current stock where menu inventory is available.</p>
          </div>
        </div>
        <div className={styles.inventoryTable} role="table" aria-label="Inventory planning">
          <div className={styles.tableHeader} role="row">
            <span>Meal</span>
            <span>Demand</span>
            <span>Current Stock</span>
            <span>Suggested Buffer</span>
          </div>
          {report.inventoryRows.length === 0 ? (
            <p className={styles.empty}>No meal inventory data available yet.</p>
          ) : (
            report.inventoryRows.map((row) => (
              <div key={row.label} className={styles.tableRow} role="row">
                <span>{row.label}</span>
                <strong>{row.demand}</strong>
                <span>{row.stock}</span>
                <span>{row.suggested}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </section>
  )
}

function Metric({ label, value, tone }) {
  return (
    <article className={`${styles.metric} ${tone ? styles[tone] : ''}`}>
      <span className={styles.metricValue}>{value}</span>
      <span className={styles.metricLabel}>{label}</span>
    </article>
  )
}

function Chart({ rows, emptyLabel }) {
  if (rows.length === 0) return <p className={styles.empty}>{emptyLabel}</p>
  return (
    <div className={styles.chart}>
      {rows.map((row) => (
        <div key={row.label} className={styles.chartRow}>
          <div className={styles.chartLabel}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
          <div className={styles.barTrack}>
            <span className={styles.barFill} style={{ width: `${Math.max(row.percent, 4)}%` }} />
          </div>
          <span className={styles.percent}>{row.percent}%</span>
        </div>
      ))}
    </div>
  )
}

function buildReport({ orders, menuItems, summary }) {
  const byMeal = summary?.byMeal ?? countBy(orders, (o) => o.meal || 'Unknown')
  const byStatus = summary?.byStatus ?? countBy(orders, (o) => o.status || 'pending')
  const byCategory = summary?.byCategory ?? {
    meal: orders.filter((o) => o.meal).length,
    drink: orders.filter((o) => o.drink).length,
    dessert: orders.filter((o) => o.dessert).length,
    snack: orders.filter((o) => o.snack).length,
  }
  const totalOrders = summary?.total ?? orders.length
  const delivered = Number(byStatus.delivered || 0)
  const mealRows = chartRows(byMeal, totalOrders).slice(0, 8)
  const statusRows = chartRows(byStatus, totalOrders, ['pending', 'preparing', 'delivered'])
  const categoryRows = chartRows(labelMap(byCategory), Math.max(...Object.values(byCategory), 0))
  const topMeal = mealRows[0]?.label || ''
  const addonCounts = {
    Drink: orders.filter((o) => o.drink).length,
    Dessert: orders.filter((o) => o.dessert).length,
    Snack: orders.filter((o) => o.snack).length,
  }
  const topAddon = chartRows(addonCounts, Math.max(...Object.values(addonCounts), 0))[0]?.label || ''
  const inventoryRows = mealRows.map((row) => {
    const menuItem = menuItems.find((item) => item.name === row.label)
    const stock = Number(menuItem?.stock ?? menuItem?.stockCount ?? 0)
    return {
      label: row.label,
      demand: row.value,
      stock: menuItem ? stock : 'N/A',
      suggested: Math.ceil(row.value * 1.2),
    }
  })
  const completionRate = totalOrders ? Math.round((delivered / totalOrders) * 100) : 0
  const generatedAt = new Date().toLocaleString()
  const fileBaseName = `skyserve-report-${new Date().toISOString().slice(0, 10)}`

  return {
    fileBaseName,
    generatedAt,
    orders,
    mealRows,
    statusRows,
    categoryRows,
    inventoryRows,
    metrics: {
      totalOrders,
      completionRate,
      topMeal,
      topAddon,
    },
    insights: buildInsights({
      totalOrders,
      completionRate,
      topMeal,
      topAddon,
      mealRows,
      statusRows,
      inventoryRows,
    }),
  }
}

function buildInsights({ totalOrders, completionRate, topMeal, topAddon, mealRows, statusRows, inventoryRows }) {
  if (!totalOrders) {
    return [
      'No passenger orders have been recorded yet. Once orders arrive, this report will identify demand and preference patterns.',
      'Use early orders to validate meal stock levels before departure service peaks.',
    ]
  }

  const pending = statusRows.find((row) => row.label === 'pending')?.value || 0
  const topShare = mealRows[0]?.percent || 0
  const lowStock = inventoryRows.find((row) => typeof row.stock === 'number' && row.stock < row.suggested)

  return [
    `${topMeal || 'The leading meal'} represents ${topShare}% of meal demand; prioritize this item during restocking and galley allocation.`,
    `${topAddon || 'Add-on selections'} currently lead passenger add-on preferences, useful for planning drink, dessert, and snack inventory.`,
    `${completionRate}% of orders are delivered. ${pending} pending orders remain visible for crew workload planning.`,
    lowStock
      ? `${lowStock.label} demand is above the suggested buffer. Consider increasing stock from ${lowStock.stock} to at least ${lowStock.suggested}.`
      : 'Current visible meal stock is not below the suggested demand buffer for the top requested meals.',
  ]
}

function chartRows(source, denominator, preferredOrder) {
  const entries = preferredOrder
    ? preferredOrder.map((key) => [key, Number(source[key] || 0)])
    : Object.entries(source)

  return entries
    .map(([label, value]) => ({
      label: formatLabel(label),
      value: Number(value || 0),
      percent: denominator ? Math.round((Number(value || 0) / denominator) * 100) : 0,
    }))
    .filter((row) => row.value > 0 || preferredOrder)
    .sort((a, b) => (preferredOrder ? 0 : b.value - a.value))
}

function labelMap(source) {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [formatLabel(key), value]))
}

function formatLabel(value) {
  const text = String(value || 'Unknown')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function countBy(items, pick) {
  return items.reduce((acc, item) => {
    const key = pick(item)
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
}
