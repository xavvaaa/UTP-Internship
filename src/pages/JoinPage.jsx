import { Navigate } from 'react-router-dom'

/** Legacy QR landing — passenger entry is access code + seat on `/`. */
export default function JoinPage() {
  return <Navigate to="/" replace />
}
