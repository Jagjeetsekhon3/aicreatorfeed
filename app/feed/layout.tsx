import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Feed',
  description: 'Your personalized AI creator feed. See posts from creators you follow.',
}
export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
