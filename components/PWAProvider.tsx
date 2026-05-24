'use client'
import { useEffect } from 'react'

export default function PWAProvider() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(reg => {
          console.log('SW registered:', reg.scope)
          // Check for updates every hour
          setInterval(() => reg.update(), 3600000)
        })
        .catch(err => console.warn('SW registration failed:', err))
    }
  }, [])

  return null
}
