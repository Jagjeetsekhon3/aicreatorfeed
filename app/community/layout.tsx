import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Community',
  description: 'Join spaces, share ideas, and discuss AI tools with the AiCreatorFeed community.',
}
export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
