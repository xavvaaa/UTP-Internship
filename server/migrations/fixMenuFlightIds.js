/**
 * Migration script to fix menu items with empty flightId values.
 * This script should be run once to update existing menu items that were created
 * without proper flight_instance_id assignment.
 */

import { adminDb } from '../firebaseAdmin.js'

async function fixMenuFlightIds() {
  try {
    console.log('Starting menu flightId fix migration...')
    
    // Get all menu items with empty or missing flightId
    const menuSnapshot = await adminDb
      .collection('menu')
      .where('flightId', '==', '')
      .get()
    
    console.log(`Found ${menuSnapshot.size} menu items with empty flightId`)
    
    // Get all active flight sessions to assign to orphaned menu items
    const sessionsSnapshot = await adminDb
      .collection('flight_sessions')
      .where('status', '==', 'active')
      .get()
    
    if (sessionsSnapshot.size === 0) {
      console.log('No active flight sessions found. Cannot fix orphaned menu items.')
      return
    }
    
    // Use the first active session for orphaned items
    const activeSession = sessionsSnapshot.docs[0]
    const activeFlightId = activeSession.id
    
    console.log(`Using active flight session: ${activeFlightId}`)
    
    // Update each orphaned menu item
    const batch = adminDb.batch()
    let updateCount = 0
    
    menuSnapshot.forEach(doc => {
      const menuRef = adminDb.collection('menu').doc(doc.id)
      batch.update(menuRef, {
        flightId: activeFlightId,
        updatedAt: adminDb.firestore.FieldValue.serverTimestamp()
      })
      updateCount++
    })
    
    if (updateCount > 0) {
      await batch.commit()
      console.log(`Successfully updated ${updateCount} menu items with flightId: ${activeFlightId}`)
    } else {
      console.log('No menu items needed updating')
    }
    
    console.log('Migration completed successfully')
    
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

// Run the migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixMenuFlightIds()
    .then(() => {
      console.log('Migration completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}

export { fixMenuFlightIds }
