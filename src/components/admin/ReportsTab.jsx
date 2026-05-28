import { downloadCsv } from '../../utils/csvExport'
import styles from './ReportsTab.module.css'

export default function ReportsTab({ orders, summary, onRefresh }) {
  const byMeal = countBy(orders, (o) => o.meal || 'Unknown')
  const byStatus = countBy(orders, (o) => o.status || 'pending')
  const byCategory = {
    meal: orders.filter((o) => o.meal).length,
    drink: orders.filter((o) => o.drink).length,
    dessert: orders.filter((o) => o.dessert).length,
    snack: orders.filter((o) => o.snack).length,
  }

  function exportCsv() {
    downloadCsv(
      'ifmod-orders-report.csv',
      ['Order ID', 'Seat', 'Meal', 'Drink', 'Dessert', 'Snack', 'Status'],
      orders.map((o) => [o.orderId, o.seatNumber, o.meal, o.drink, o.dessert, o.snack ?? '', o.status]),
    )
  }

  return (
    <section className={styles.wrap}>
      {onRefresh ? (
        <button type="button" className={styles.button} onClick={onRefresh}>
          Refresh secure report
        </button>
      ) : null}
      <div className={styles.cards}>
        <Card label="Total Orders" value={summary?.total ?? orders.length} />
        <Card label="Meals" value={summary?.byCategory?.meal ?? byCategory.meal} />
        <Card label="Drinks" value={summary?.byCategory?.drink ?? byCategory.drink} />
        <Card label="Desserts" value={summary?.byCategory?.dessert ?? byCategory.dessert} />
        <Card label="Snacks" value={summary?.byCategory?.snack ?? byCategory.snack} />
      </div>
      <div className={styles.block}>
        <h3>Status Breakdown</h3>
        <ul>{Object.entries(summary?.byStatus ?? byStatus).map(([k, v]) => <li key={k}>{k}: {v}</li>)}</ul>
      </div>
      <div className={styles.block}>
        <h3>Orders per Meal</h3>
        <ul>{Object.entries(summary?.byMeal ?? byMeal).map(([k, v]) => <li key={k}>{k}: {v}</li>)}</ul>
      </div>
      <button type="button" className={styles.button} onClick={exportCsv}>Export CSV</button>
    </section>
  )
}

function Card({ label, value }) {
  return <article className={styles.card}><p>{label}</p><strong>{value}</strong></article>
}

function countBy(items, pick) {
  return items.reduce((acc, item) => {
    const key = pick(item)
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
}
