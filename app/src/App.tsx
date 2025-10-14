import { useState, useEffect } from 'react'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { ref, set, get } from 'firebase/database'
import { firestore, database } from './firebase'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [firestoreStatus, setFirestoreStatus] = useState<string>('Testing...')
  const [rtdbStatus, setRtdbStatus] = useState<string>('Testing...')

  useEffect(() => {
    // Test Firestore connection
    const testFirestore = async () => {
      try {
        const testDoc = doc(firestore, 'test', 'connection')
        await setDoc(testDoc, { 
          message: 'Hello from Firestore!', 
          timestamp: new Date().toISOString() 
        })
        const docSnap = await getDoc(testDoc)
        if (docSnap.exists()) {
          setFirestoreStatus(`✅ Firestore connected: ${docSnap.data().message}`)
        } else {
          setFirestoreStatus('❌ Firestore write succeeded but read failed')
        }
      } catch (error) {
        setFirestoreStatus(`❌ Firestore error: ${error}`)
      }
    }

    // Test Realtime Database connection
    const testRTDB = async () => {
      try {
        const testRef = ref(database, 'test/connection')
        await set(testRef, {
          message: 'Hello from RTDB!',
          timestamp: new Date().toISOString()
        })
        const snapshot = await get(testRef)
        if (snapshot.exists()) {
          setRtdbStatus(`✅ RTDB connected: ${snapshot.val().message}`)
        } else {
          setRtdbStatus('❌ RTDB write succeeded but read failed')
        }
      } catch (error) {
        setRtdbStatus(`❌ RTDB error: ${error}`)
      }
    }

    testFirestore()
    testRTDB()
  }, [])

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>CollabCanvas - Phase 0 Setup</h1>
      
      {/* Firebase Connection Status */}
      <div className="card">
        <h3>🔥 Firebase Emulator Status</h3>
        <p>{firestoreStatus}</p>
        <p>{rtdbStatus}</p>
        <small>Check the Firebase Emulator UI at: <a href="http://localhost:4000" target="_blank">http://localhost:4000</a></small>
      </div>

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
