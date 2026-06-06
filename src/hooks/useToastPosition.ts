import { useState, useEffect } from 'react'
import type { ToastPosition } from '@/types'

export function useToastPosition(): ToastPosition {
  const [position, setPosition] = useState<ToastPosition>(
    () => (window.innerWidth < 768 ? 'top-center' : 'bottom-right')
  )
  useEffect(() => {
    const handler = () =>
      setPosition(window.innerWidth < 768 ? 'top-center' : 'bottom-right')
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return position
}
