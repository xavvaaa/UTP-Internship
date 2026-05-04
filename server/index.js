import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import orderRoutes from './routes/orderRoutes.js'
import menuRoutes from './routes/menuRoutes.js'
import reportsRoutes from './routes/reportsRoutes.js'
import settingsRoutes from './routes/settingsRoutes.js'
import sessionRoutes from './routes/sessionRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

const app = express()
const port = Number(process.env.API_PORT || 3001)

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api', orderRoutes)
app.use('/api', menuRoutes)
app.use('/api', reportsRoutes)
app.use('/api', settingsRoutes)
app.use('/api', sessionRoutes)
app.use('/api', adminRoutes)

app.listen(port, () => {
  console.log(`Order API listening on http://localhost:${port}`)
})
