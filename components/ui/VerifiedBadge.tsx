export default function VerifiedBadge({ isOfficial = false, size = 16 }: { isOfficial?: boolean; size?: number }) {
  if (isOfficial) return (
    <span title="Official AiCreatorFeed account" style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7.5" fill="var(--color-primary)"/>
        <path d="M4.5 8.5L6.5 10.5L11.5 5.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  )

  return (
    <span title="Verified creator" style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <path d="M8 1L9.8 3.2L12.5 2.5L12.8 5.3L15.5 6.5L14 9L15.5 11.5L12.8 12.7L12.5 15.5L9.8 14.8L8 17L6.2 14.8L3.5 15.5L3.2 12.7L0.5 11.5L2 9L0.5 6.5L3.2 5.3L3.5 2.5L6.2 3.2L8 1Z" fill="var(--color-primary)"/>
        <path d="M5.5 8.5L7 10L10.5 6.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  )
}
