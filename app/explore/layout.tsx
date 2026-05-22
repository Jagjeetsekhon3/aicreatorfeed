import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Explore',
  description: 'Discover trending AI prompts, images, and videos from the AiCreatorFeed community.',
}
export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
