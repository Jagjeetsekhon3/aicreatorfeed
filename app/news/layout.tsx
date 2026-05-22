import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'AI News',
  description: 'Stay up to date with the latest AI news, model releases, and industry updates.',
}
export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
