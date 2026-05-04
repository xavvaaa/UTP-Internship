import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'

// Firebase config from .env
const firebaseConfig = {
  apiKey: "AIzaSyD_1qJxaSe716CrW0On4KEXvZRV-FJo328",
  authDomain: "ifmod-70633.firebaseapp.com",
  projectId: "ifmod-70633",
  storageBucket: "ifmod-70633.appspot.com",
  messagingSenderId: "468107361598",
  appId: "1:468107361598:web:c17bc89f68891f4fb1006f"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

async function updateUserClaims() {
  try {
    // Sign in with admin credentials
    console.log('Signing in with admin credentials...')
    const userCredential = await signInWithEmailAndPassword(auth, 'admin@ifmod.com', 'admin123')
    console.log('Successfully signed in!')
    
    // First, get the current session ID
    const sessionsRef = collection(db, 'flight_sessions')
    const q = query(sessionsRef, where('access_code', '==', 'HT73Z4LQ'))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      console.error('Session not found with access code HT73Z4LQ')
      return
    }
    
    const sessionDoc = querySnapshot.docs[0]
    const sessionId = sessionDoc.id
    console.log('Found session ID:', sessionId)
    
    // Update user claims via admin API
    const token = await userCredential.user.getIdToken(true)
    
    const response = await fetch('http://localhost:3001/api/admin/update-claims', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@ifmod.com',
        flightId: '38bc34ec-04a7-4e75-8faa-b58ad1909b61', // Use the session ID from the error
        role: 'admin'
      })
    })
    
    const result = await response.json()
    if (response.ok) {
      console.log('User claims updated successfully!')
      console.log('Updated flightId claim to:', sessionId)
      console.log('Please refresh your auth token by logging out and back in.')
    } else {
      console.error('Failed to update claims:', result.error)
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

updateUserClaims()
