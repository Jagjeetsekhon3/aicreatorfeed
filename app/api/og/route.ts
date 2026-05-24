import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') || 'AiCreatorFeed'
  const subtitle = searchParams.get('subtitle') || 'Where AI Creators Connect'

  // Escape for SVG
  const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')

  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1a1a1a"/>
      <stop offset="100%" stop-color="#2a2020"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="400" y2="400" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="200" cy="200" r="300" fill="url(#glow)"/>
  <rect x="2" y="2" width="1196" height="626" rx="16" fill="none" stroke="rgba(255,109,31,0.3)" stroke-width="2"/>
  <circle cx="120" cy="120" r="48" fill="rgba(255,109,31,0.15)" stroke="rgba(255,109,31,0.4)" stroke-width="2"/>
  <text x="120" y="132" text-anchor="middle" font-family="Arial Black,Arial" font-size="40" font-weight="900" fill="var(--color-primary)">A</text>
  <circle cx="152" cy="150" r="6" fill="var(--color-primary)"/>
  <text x="100" y="340" font-family="Arial Black,Arial" font-size="60" font-weight="900" fill="var(--color-cream)">${esc(title.slice(0,30))}</text>
  <text x="100" y="408" font-family="Arial,sans-serif" font-size="28" fill="#9a8f7a">${esc(subtitle.slice(0,65))}</text>
  <text x="100" y="558" font-family="Arial Black,Arial" font-size="22" font-weight="900" fill="rgba(255,109,31,0.8)">aicreatorfeed.com</text>
  <circle cx="1100" cy="120" r="8" fill="rgba(255,109,31,0.4)"/>
  <circle cx="1140" cy="158" r="5" fill="rgba(255,109,31,0.25)"/>
  <circle cx="1080" cy="178" r="4" fill="rgba(255,109,31,0.2)"/>
</svg>`

  return new NextResponse(svg, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
  })
}
