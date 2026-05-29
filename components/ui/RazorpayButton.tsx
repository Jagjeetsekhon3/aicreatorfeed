'use client'
import { useState } from 'react'

type Props = {
  plan: string
  type: 'donation' | 'subscription' | 'ad'
  label: string
  amount?: number        // rupees for display (e.g. 299)
  customAmount?: number  // rupees for custom donation
  accessToken?: string
  onSuccess?: (paymentId: string) => void
  onError?: (err: string) => void
  children?: React.ReactNode
  style?: React.CSSProperties
}

declare global {
  interface Window {
    Razorpay: any
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function RazorpayButton({ plan, type, label, amount, customAmount, accessToken, onSuccess, onError, children, style }: Props) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handlePay() {
    setLoading(true)
    setErrorMsg('')

    // 1. Load Razorpay SDK
    const loaded = await loadRazorpayScript()
    if (!loaded) {
      setErrorMsg('Failed to load payment gateway. Check your internet connection.')
      setLoading(false)
      return
    }

    // 2. Create order
    const res = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ plan, type, custom_amount: customAmount }),
    })
    const orderData = await res.json()

    if (orderData.setup) {
      setErrorMsg('Payment not configured yet. Add Razorpay keys in Admin → Payment Settings.')
      setLoading(false)
      return
    }
    if (!res.ok || orderData.error) {
      setErrorMsg(orderData.error || 'Failed to create order')
      setLoading(false)
      return
    }

    // 3. Open Razorpay checkout
    const options = {
      key: orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency,
      name: orderData.name,
      description: orderData.description,
      order_id: orderData.order_id,
      theme: { color: getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#FF6D1F' },
      prefill: {},
      handler: async function (response: any) {
        // 4. Verify payment
        const verifyRes = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            plan,
            type,
          }),
        })
        const verifyData = await verifyRes.json()
        if (verifyData.success) {
          setStatus('success')
          onSuccess?.(response.razorpay_payment_id)
        } else {
          setErrorMsg(verifyData.error || 'Payment verification failed')
          setStatus('error')
          onError?.(verifyData.error)
        }
        setLoading(false)
      },
      modal: {
        ondismiss: () => setLoading(false),
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (response: any) => {
      setErrorMsg(response.error?.description || 'Payment failed')
      setStatus('error')
      onError?.(response.error?.description)
      setLoading(false)
    })
    rzp.open()
  }

  if (status === 'success') return (
    <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '12px', ...style }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>✓</div>
      <p style={{ color: '#4ade80', fontWeight: 700, fontSize: '14px', margin: 0 }}>Payment successful!</p>
    </div>
  )

  return (
    <div>
      <button onClick={handlePay} disabled={loading} style={{
        background: loading ? 'color-mix(in srgb, var(--color-primary) 50%, transparent)' : 'var(--color-primary)',
        border: 'none', color: '#fff', fontWeight: 800, cursor: loading ? 'wait' : 'pointer',
        borderRadius: '12px', padding: '12px 28px', fontSize: '14px', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        transition: 'opacity 0.2s', width: '100%',
        ...style,
      }}>
        {loading ? (
          <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Processing...</>
        ) : children || `Pay ${amount ? `₹${amount}` : ''}`}
      </button>
      {errorMsg && <p style={{ color: '#ff8080', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>{errorMsg}</p>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
