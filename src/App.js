import './App.css';

import { useEffect, useRef, useCallback } from 'react'

export default function App() {
  const workerRef = useRef()
  useEffect(() => {
    workerRef.current = new Worker(new URL('./vmaf_worker.js', import.meta.url))
    workerRef.current.onmessage = (evt) =>
        alert(`WebWorker Response => ${evt.data}`)
    return () => {
      workerRef.current.terminate()
    }
  }, [])

  const handleWork = useCallback(async () => {
    workerRef.current.postMessage("one")
  }, [])

  return (
      <div>
        <p>Do work in a WebWorker!</p>
        <button onClick={handleWork}>Calculate PI</button>
      </div>
  )
}