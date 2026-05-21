import { cookies } from 'next/headers'

export function isAdminAuthenticated(): boolean {
  const cookieStore = cookies()
  const token = cookieStore.get('acf_admin_token')?.value
  const expected = process.env.ADMIN_PASSWORD
  return !!token && !!expected && token === `admin_${expected}`
}

export function getAdminPath(): string {
  return process.env.ADMIN_SECRET_PATH || 'acfjagjeetadmin'
}
