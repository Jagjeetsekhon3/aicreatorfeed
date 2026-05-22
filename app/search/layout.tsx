import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Search',
  description: 'Search for AI creators, prompts, spaces, news, and tutorials on AiCreatorFeed.',
}
export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
