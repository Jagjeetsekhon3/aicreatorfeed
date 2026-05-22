import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Tutorials',
  description: 'Weekly AI tutorials covering Midjourney, Runway, Sora, prompt engineering, and more.',
}
export default function TutorialsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
