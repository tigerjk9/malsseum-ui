import { NextRequest } from 'next/server'
import { signAdminToken } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD
  const authSecret = process.env.AUTH_SECRET

  if (!adminPassword || !authSecret) {
    return Response.json(
      { error: '서버 설정이 완료되지 않았습니다. 관리자에게 문의하세요.' },
      { status: 500 }
    )
  }

  const body = await req.json().catch(() => ({})) as { password?: string }

  const correct = body.password === adminPassword
  if (!correct) {
    return Response.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 })
  }

  const token = signAdminToken()
  return Response.json({ token })
}
