import type { Metadata } from 'next'
const titles: Record<string, string> = { donate: 'Support Us', verify: 'Get Verified', advertise: 'Advertise' }
export const metadata: Metadata = { title: titles['verify'] }
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</> }
