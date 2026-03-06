import { NextResponse } from "next/server"

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const secretKey = process.env.SB_SECRET_KEY!

  const res = await fetch(`${supabaseUrl}/functions/v1/demo-secret-admin`, {
    headers: {
      apikey: secretKey,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status })
  }

  return NextResponse.json(data)
}
