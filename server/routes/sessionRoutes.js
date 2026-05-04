/**
 * Flight Session Routes — register static paths before /session/:id
 */
import { Router } from 'express'
import {
  createSession,
  getAllSessions,
  resolveSession,
  joinPassenger,
  endSession,
  updateSession,
  deleteSession,
  getSessionById,
  checkSeatAvailability,
  getSessionSummary,
} from '../controllers/sessionController.js'
import { requireAuth } from '../middleware/authz.js'

const sessionRoutes = Router()

// --- Static paths first (avoid :id capturing "summary") ---
sessionRoutes.post('/session/resolve', resolveSession)

sessionRoutes.get('/session/summary', requireAuth, getSessionSummary)

sessionRoutes.post('/session', requireAuth, createSession)
sessionRoutes.get('/session', requireAuth, getAllSessions)

sessionRoutes.patch('/session/:id/end', requireAuth, endSession)
sessionRoutes.put('/session/:id', requireAuth, updateSession)
sessionRoutes.delete('/session/:id', requireAuth, deleteSession)

sessionRoutes.post('/session/:id/join-passenger', joinPassenger)
sessionRoutes.post('/session/:id/occupy', joinPassenger)
sessionRoutes.get('/session/:id/seat/:seatNumber/available', checkSeatAvailability)

sessionRoutes.get('/session/:id', getSessionById)

export default sessionRoutes
