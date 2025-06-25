// src/components/FeedbackComponents/Timer.tsx

// AI Generated Code

import { useEffect, useRef, useState } from 'react'

export function useTimer(initialTime = 0) {
  const [elapsed, setElapsed] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(false)
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const accumulatedRef = useRef<number>(initialTime)

  const tick = () => {
    const now = Date.now()
    const totalElapsed = accumulatedRef.current + (now - startTimeRef.current)
    setElapsed(totalElapsed)
    timerRef.current = setTimeout(tick, 100)
  }

  const start = () => {
    if (!isRunning) {
      startTimeRef.current = Date.now()
      timerRef.current = setTimeout(tick, 100)
      setIsRunning(true)
    }
  }

  const pause = () => {
    if (isRunning) {
      clearTimeout(timerRef.current!)
      accumulatedRef.current += Date.now() - startTimeRef.current
      setIsRunning(false)
    }
  }

  const reset = () => {
    clearTimeout(timerRef.current!)
    setElapsed(0)
    accumulatedRef.current = 0
    setIsRunning(false)
  }

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current!)
    }
  }, [])

  return {
    elapsed,
    isRunning,
    start,
    pause,
    reset
  }
}