import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the AiCreatorFeed team. Send us a message, report a bug, or find us on social media.',
}
export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
