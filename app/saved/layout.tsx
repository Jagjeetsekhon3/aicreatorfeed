import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Saved Posts',
  description: 'Your bookmarked AI prompts and posts on AiCreatorFeed.',
}
export default function SavedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
