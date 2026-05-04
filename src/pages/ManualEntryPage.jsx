import { Navigate } from 'react-router-dom'

/** Legacy manual flight search — use access code + seat on `/`. */
export default function ManualEntryPage() {
  return <Navigate to="/" replace />
}
