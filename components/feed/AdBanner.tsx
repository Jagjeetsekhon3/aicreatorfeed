'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

type Ad = { id: string; title: string; description: string | null; image_url: string | null; link_url: string; cta_text: string; slot: string }

async function trackImpression(adId: string) {
  await fetch('/api/ads/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ad_id: adId, type: 'impression' }) }).catch(() => {})
}

async function trackClick(adId: string) {
  await fetch('/api/ads/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ad_id: adId, type: 'click' }) }).catch(() => {})
}

export default function AdBanner({ slot = 'feed_mid' }: { slot?: string }) {
  const [ad, setAd] = useState<Ad | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch(`/api/ads/setup?slot=${slot}`)
      .then(r => r.json())
      .then(d => {
        if (d.ad) {
          setAd(d.ad)
          trackImpression(d.ad.id)
        }
      })
      .catch(() => {})
  }, [slot])

  if (!ad || dismissed) return null

  return (
    <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '14px 16px', margin: '8px 0', position: 'relative', overflow: 'hidden' }}>
      {/* Sponsored label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#555', letterSpacing: '0.05em' }}>SPONSORED</span>
        <button onClick={() => setDismissed(true)}
          style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '14px', padding: '0 2px', lineHeight: 1 }}>×</button>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {ad.image_url && (
          <img src={ad.image_url} alt={ad.title} style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-cream)', marginBottom: '3px' }}>{ad.title}</div>
          {ad.description && <div style={{ fontSize: '12px', color: '#9a8f7a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.description}</div>}
        </div>
        <a href={ad.link_url} target="_blank" rel="noopener noreferrer"
          onClick={() => trackClick(ad.id)}
          style={{ flexShrink: 0, background: 'var(--color-primary)', color: '#fff', fontWeight: 700, padding: '7px 14px', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', whiteSpace: 'nowrap' }}>
          {ad.cta_text}
        </a>
      </div>
    </div>
  )
}
