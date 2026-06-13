import { adminAuth, adminDb } from './firebaseAdmin.js'

async function tempUpdateClaims() {
  try {
    console.log('Temporarily updating admin claims...')
    
    // Update admin user claims directly
    const userRecord = await adminAuth.getUserByEmail('admin@ifmod.com')
    console.log('Found user:', userRecord.email)
    
    // Set custom claims with the session ID
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      flightId: '38bc34ec-04a7-4e75-8faa-b58ad1909b61',
      role: 'admin'
    })
    
    console.log('User claims updated successfully!')
    console.log('Updated flightId claim to: 38bc34ec-04a7-4e75-8faa-b58ad1909b61')
    console.log('Please log out and log back in to refresh your auth token.')
    
  } catch (error) {
    console.error('Error updating user claims:', error.message)
  }
}

tempUpdateClaims()
