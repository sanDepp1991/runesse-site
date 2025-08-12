import { NextResponse } from 'next/server'

// Set this to your webhook URL (Google Apps Script / Airtable / Make.com)
const WEBHOOK_URL = process.env.SUBSCRIBE_WEBHOOK || ''

export async function POST(req: Request) {
  const formData = await req.formData()
  const email = String(formData.get('email') || '').trim()

  if (!email) {
    return NextResponse.json({ ok: false, error: 'Missing email' }, { status: 400 })
  }

  if (!WEBHOOK_URL) {
    console.warn('No SUBSCRIBE_WEBHOOK configured. Received:', email)
    return NextResponse.json({ ok: true, stored: false, note: 'No webhook configured. Email logged to server console.' })
  }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source: 'runesse-site', ts: new Date().toISOString() })
    })
    if (!res.ok) throw new Error(`Webhook error: ${res.status}`)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
