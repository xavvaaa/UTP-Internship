/**
 * Migration script to add color field to existing menu items in Firestore
 * Run this once to update all existing menu items with a default color
 */

import { adminDb } from '../firebaseAdmin.js'

async function addColorToMenuItems() {
  try {
    console.log('Starting migration: Adding color field to menu items...')
    
    // Get all menu items
    const snapshot = await adminDb.collection('menu').get()
    
    if (snapshot.empty) {
      console.log('No menu items found. Migration completed.')
      return
    }
    
    console.log(`Found ${snapshot.size} menu items to update...`)
    
    // Batch update all items without color field
    const batch = adminDb.batch()
    let updatedCount = 0
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      
      // Only update if color field doesn't exist
      if (!data.color) {
        const docRef = adminDb.collection('menu').doc(doc.id)
        batch.update(docRef, { 
          color: '#3b82f6', // Default blue color
          updatedAt: adminDb.firestore.FieldValue.serverTimestamp()
        })
        updatedCount++
      }
    })
    
    if (updatedCount > 0) {
      await batch.commit()
      console.log(`Successfully updated ${updatedCount} menu items with default color.`)
    } else {
      console.log('All menu items already have color field. No updates needed.')
    }
    
    console.log('Migration completed successfully!')
    
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

// Run the migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addColorToMenuItems()
    .then(() => {
      console.log('Migration script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration script failed:', error)
      process.exit(1)
    })
}

export { addColorToMenuItems }
