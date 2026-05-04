import admin from 'firebase-admin'
import fs from 'node:fs'

try {
  console.log('Loading service account...')
  const serviceAccount = JSON.parse(fs.readFileSync('./service-account.json', 'utf8'))

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })

  // flightId must be the Firestore document id of `flight_sessions/{flightInstanceId}` (UUID) for this user to manage that flight.
  const [email, password, role, flightId] = process.argv.slice(2)
  if (!email || !password || !role || !flightId) {
    throw new Error(
      'Usage: node scripts/create-crew-user.mjs <email> <password> <admin|crew> <flightInstanceId>',
    )
  }

  const user = await admin.auth().createUser({ email, password, emailVerified: true })
  await admin.auth().setCustomUserClaims(user.uid, { role, flightId })

  const check = await admin.auth().getUser(user.uid)
  console.log('Created user:', check.email, 'uid:', check.uid)
  console.log('Claims:', check.customClaims)
} catch (err) {
  console.error('FAILED:', err.message)
  process.exit(1)
}