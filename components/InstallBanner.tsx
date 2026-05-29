'use client'
import { useState, useEffect } from 'react'

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true
    if (isStandalone) { setIsInstalled(true); return }

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 86400000) return // 7 days

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(ios)

    if (ios) {
      // Show iOS instructions after 3 seconds
      setTimeout(() => setShow(true), 3000)
      return
    }

    // Android / Chrome — listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setShow(true), 2000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem('pwa-install-dismissed', String(Date.now()))
    setShow(false)
  }

  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  if (!show || isInstalled) return null

  return (
    <div style={{
      position: 'fixed', bottom: '72px', left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)', maxWidth: '480px',
      background: '#2a2a2a', border: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)',
      borderRadius: '16px', padding: '14px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      zIndex: 200, animation: 'slideUp 0.3s ease',
      display: 'flex', gap: '12px', alignItems: 'flex-start',
    }}>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>

      {/* App icon */}
      <img src="/icons/icon-72x72.png" alt="AiCreatorFeed" style={{ width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-cream)', marginBottom: '2px' }}>
          Install AiCreatorFeed
        </div>
        {isIOS ? (
          <div style={{ fontSize: '12px', color: '#9a8f7a', lineHeight: 1.5 }}>
            Tap <strong style={{ color: 'var(--color-cream)' }}>Share</strong> then <strong style={{ color: 'var(--color-cream)' }}>"Add to Home Screen"</strong> to install
          </div>
        ) : (
          <div style={{ fontSize: '12px', color: '#9a8f7a' }}>
            Add to your home screen for the best experience
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        {!isIOS && deferredPrompt && (
          <button onClick={install}
            style={{ background: 'var(--color-primary)', border: 'none', color: '#fff', fontWeight: 700, padding: '7px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            Install
          </button>
        )}
        <button onClick={dismiss}
          style={{ background: 'rgba(255,255,255,0.07)', border: 'none', color: '#9a8f7a', padding: '7px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
          ✕
        </button>
      </div>
    </div>
  )
}
