import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const correct = process.env.DASHBOARD_PASSWORD || 'uninassau2024'
  if (password === correct) {
    const res = NextResponse.json({ ok: true })
    res.cookies.set('auth', 'true', { httpOnly: true, maxAge: 60 * 60 * 24 * 7 })
    return res
  }
  return NextResponse.json({ ok: false }, { status: 401 })
}
