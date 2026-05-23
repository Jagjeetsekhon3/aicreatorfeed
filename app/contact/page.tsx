'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type SocialLink = { icon: string; label: string; handle: string; url: string; color: string }

export default function ContactPage() {
  const supabase = createClient()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('general')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  // Site social settings
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [contactEmail, setContactEmail] = useState('')
  const [contactMessage, setContactMessage] = useState('')

  useEffect(() => {
    // Pre-fill email if logged in
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email) setEmail(data.session.user.email)
      supabase.from('profiles').select('full_name').eq('id', data.session?.user?.id || '').single()
        .then(({ data: p }) => { if (p?.full_name) setName(p.full_name) })
    })

    // Load social links and contact message from site_settings
    fetch('/api/site-settings').then(r => r.json()).then(d => {
      const s = d.settings || {}
      setContactEmail(s.contact_email || '')
      setContactMessage(s.contact_message || "Have a question, idea, or issue? We'd love to hear from you. Fill out the form below and we'll get back to you as soon as possible.")

      const links: SocialLink[] = []
      if (s.social_twitter)  links.push({ icon: '𝕏', label: 'Twitter / X', handle: `@${s.social_twitter}`, url: `https://twitter.com/${s.social_twitter}`, color: '#1d9bf0' })
      if (s.social_instagram) links.push({ icon: '📸', label: 'Instagram', handle: `@${s.social_instagram}`, url: `https://instagram.com/${s.social_instagram}`, color: '#e1306c' })
      if (s.social_discord)  links.push({ icon: '💬', label: 'Discord', handle: s.social_discord_label || 'Join our server', url: s.social_discord, color: '#5865F2' })
      if (s.social_youtube)  links.push({ icon: '▶', label: 'YouTube', handle: s.social_youtube_label || 'Watch tutorials', url: s.social_youtube, color: '#ff0000' })
      if (s.social_tiktok)   links.push({ icon: '♪', label: 'TikTok', handle: `@${s.social_tiktok}`, url: `https://tiktok.com/@${s.social_tiktok}`, color: '#ff0050' })
      if (s.social_linkedin) links.push({ icon: 'in', label: 'LinkedIn', handle: s.social_linkedin_label || 'Connect with us', url: s.social_linkedin, color: '#0a66c2' })
      setSocialLinks(links)
    }).catch(() => {})
  }, [])

  async function handleSubmit() {
    if (!email.trim() || !subject.trim() || !message.trim()) {
      setError('Please fill in email, subject, and message.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `[${category}] ${subject}`,
          message: name ? `From: ${name}\n\n${message}` : message,
          email,
        }),
      })
      if (res.ok) setSubmitted(true)
      else setError('Something went wrong. Please try again.')
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  const categories = [
    { value: 'general',   label: '💬 General question' },
    { value: 'bug',       label: '🐛 Bug report' },
    { value: 'feature',   label: '✨ Feature request' },
    { value: 'account',   label: '👤 Account issue' },
    { value: 'content',   label: '🚩 Report content' },
    { value: 'business',  label: '🤝 Business / partnership' },
  ]

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 16px 80px' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ marginBottom: '40px', animation: 'fadeUp 0.3s ease' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,109,31,0.08)', border: '1px solid rgba(255,109,31,0.2)', color: '#FF6D1F', fontSize: '12px', fontWeight: 700, padding: '5px 14px', borderRadius: '999px', marginBottom: '16px' }}>
          ✦ GET IN TOUCH
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 6vw, 44px)', fontWeight: 900, color: '#FAF3E1', letterSpacing: '-1px', marginBottom: '12px', lineHeight: 1.1 }}>
          Contact Us
        </h1>
        <p style={{ fontSize: '15px', color: '#9a8f7a', lineHeight: 1.7, maxWidth: '520px' }}>
          {contactMessage}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px', alignItems: 'start' }}>

        {/* LEFT — Social links + info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeUp 0.35s ease' }}>

          {/* Social links */}
          {socialLinks.length > 0 && (
            <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#9a8f7a', marginBottom: '14px', letterSpacing: '0.05em' }}>FIND US ON</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {socialLinks.map(link => (
                  <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', textDecoration: 'none', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${link.color}11`; (e.currentTarget as HTMLAnchorElement).style.borderColor = `${link.color}33` }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.06)' }}
                  >
                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: `${link.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 900, color: link.color, flexShrink: 0 }}>
                      {link.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#FAF3E1' }}>{link.label}</div>
                      <div style={{ fontSize: '12px', color: '#9a8f7a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.handle}</div>
                    </div>
                    <svg style={{ marginLeft: 'auto', flexShrink: 0, color: '#555' }} width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 7h10M7 2l5 5-5 5"/></svg>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Email */}
          {contactEmail && (
            <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#9a8f7a', marginBottom: '10px', letterSpacing: '0.05em' }}>EMAIL US</h3>
              <a href={`mailto:${contactEmail}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(255,109,31,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>✉️</div>
                <span style={{ fontSize: '13px', color: '#FF6D1F', fontWeight: 600 }}>{contactEmail}</span>
              </a>
            </div>
          )}

          {/* Response time note */}
          <div style={{ background: 'rgba(255,109,31,0.05)', border: '1px solid rgba(255,109,31,0.12)', borderRadius: '14px', padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#FF6D1F', marginBottom: '6px' }}>⏱ Response time</div>
            <p style={{ fontSize: '12px', color: '#9a8f7a', lineHeight: 1.6, margin: 0 }}>
              We typically reply within <strong style={{ color: '#FAF3E1' }}>24–48 hours</strong> on weekdays. For urgent issues, mention it in your subject line.
            </p>
          </div>

          {/* Quick links */}
          <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#9a8f7a', marginBottom: '12px', letterSpacing: '0.05em' }}>QUICK LINKS</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { href: '/feed',      icon: '🏠', label: 'Go to Feed' },
                { href: '/explore',   icon: '🔭', label: 'Explore posts' },
                { href: '/tutorials', icon: '🎬', label: 'Watch tutorials' },
                { href: '/community', icon: '👥', label: 'Join community' },
              ].map(({ href, icon, label }) => (
                <Link key={href} href={href} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', textDecoration: 'none', color: '#F5E7C6', fontSize: '13px', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
                >
                  <span>{icon}</span> {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Contact form */}
        <div style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '28px', animation: 'fadeUp 0.4s ease' }}>

          {submitted ? (
            /* Success state */
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(74,222,128,0.1)', border: '2px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px' }}>✓</div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#FAF3E1', marginBottom: '10px' }}>Message sent!</h3>
              <p style={{ fontSize: '14px', color: '#9a8f7a', lineHeight: 1.7, marginBottom: '24px' }}>
                Thanks for reaching out. We&apos;ll get back to you at <strong style={{ color: '#FAF3E1' }}>{email}</strong> within 24–48 hours.
              </p>
              <button onClick={() => { setSubmitted(false); setSubject(''); setMessage(''); setCategory('general') }}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5E7C6', padding: '10px 24px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                Send another message
              </button>
            </div>
          ) : (
            /* Form */
            <>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FAF3E1', marginBottom: '20px' }}>Send us a message</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* Name + Email row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#9a8f7a', display: 'block', marginBottom: '6px' }}>Your name</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Jagjeet Singh"
                      style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#FAF3E1', fontSize: '14px', padding: '10px 12px', fontFamily: 'inherit', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#9a8f7a', display: 'block', marginBottom: '6px' }}>Email address *</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                      style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#FAF3E1', fontSize: '14px', padding: '10px 12px', fontFamily: 'inherit', outline: 'none' }} />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#9a8f7a', display: 'block', marginBottom: '6px' }}>Category</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                    {categories.map(c => (
                      <button key={c.value} onClick={() => setCategory(c.value)}
                        style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid', transition: 'all 0.15s', background: category === c.value ? 'rgba(255,109,31,0.15)' : 'rgba(255,255,255,0.04)', borderColor: category === c.value ? '#FF6D1F' : 'rgba(255,255,255,0.08)', color: category === c.value ? '#FF6D1F' : '#9a8f7a' }}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#9a8f7a', display: 'block', marginBottom: '6px' }}>Subject *</label>
                  <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="What's this about?"
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#FAF3E1', fontSize: '14px', padding: '10px 12px', fontFamily: 'inherit', outline: 'none' }} />
                </div>

                {/* Message */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#9a8f7a', display: 'block', marginBottom: '6px' }}>Message *</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} placeholder="Tell us everything…"
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#FAF3E1', fontSize: '14px', padding: '10px 12px', fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
                  <div style={{ fontSize: '11px', color: message.length > 1000 ? '#ff8080' : '#555', textAlign: 'right', marginTop: '3px' }}>{message.length}/1000</div>
                </div>

                {/* Error */}
                {error && (
                  <div style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#ff8080' }}>
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button onClick={handleSubmit} disabled={submitting}
                  style={{ background: '#FF6D1F', border: 'none', color: '#fff', fontWeight: 800, padding: '13px', borderRadius: '12px', fontSize: '14px', cursor: submitting ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: submitting ? 0.8 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'opacity 0.2s' }}>
                  {submitting ? (
                    <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Sending…</>
                  ) : '✉️ Send message'}
                </button>

                <p style={{ fontSize: '11px', color: '#555', textAlign: 'center', margin: 0 }}>
                  Your message creates a support ticket. We&apos;ll reply to your email.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
