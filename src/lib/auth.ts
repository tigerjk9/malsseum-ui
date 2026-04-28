import { createHmac, timingSafeEqual } from 'crypto'

const TOKEN_TTL_SEC = 86400 * 30 // 30 days

export function signAdminToken(secret: string): string {
  const payload = {
    role: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SEC,
  }
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret).update(data).digest('base64url')
  return `${data}.${sig}`
}

export function verifyAdminToken(token: string | null | undefined): boolean {
  const secret = process.env.AUTH_SECRET
  if (!secret || !token) return false
  try {
    const dotIdx = token.lastIndexOf('.')
    if (dotIdx === -1) return false
    const data = token.slice(0, dotIdx)
    const sig = token.slice(dotIdx + 1)
    const expected = createHmac('sha256', secret).update(data).digest('base64url')
    const sigBuf = Buffer.from(sig, 'utf8')
    const expBuf = Buffer.from(expected, 'utf8')
    if (sigBuf.length !== expBuf.length) return false
    if (!timingSafeEqual(sigBuf, expBuf)) return false
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'))
    return payload.role === 'admin' && typeof payload.exp === 'number' &&
      payload.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}
