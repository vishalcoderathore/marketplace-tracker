const SESSION_KEY = 'mkt_tracker_auth'
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000

export function getSession(): boolean {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return false
    const { expiresAt } = JSON.parse(raw) as { expiresAt: number }
    if (Date.now() > expiresAt) { localStorage.removeItem(SESSION_KEY); return false }
    return true
  } catch { return false }
}

export function setSession(): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ expiresAt: Date.now() + SESSION_DURATION }))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

export async function hashPassword(salt: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(salt + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function generateSalt(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array).map((b) => b.toString(16).padStart(2, '0')).join('')
}
