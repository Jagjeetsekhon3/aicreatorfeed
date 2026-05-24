'use client'
export const dynamic = 'force-dynamic'

export default function OfflinePage() {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>📡</div>
      <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#FAF3E1', marginBottom: '10px' }}>You are offline</h1>
      <p style={{ color: '#9a8f7a', fontSize: '15px', lineHeight: 1.7, maxWidth: '320px', marginBottom: '28px' }}>
        No internet connection. Check your Wi-Fi or mobile data and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{ background: '#FF6D1F', border: 'none', color: '#fff', fontWeight: 700, padding: '12px 28px', borderRadius: '12px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        Try again
      </button>
    </div>
  )
}
