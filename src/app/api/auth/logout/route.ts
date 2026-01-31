import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const session = await getSession(request)
  if (session?.token) {
    await prisma.session.delete({ where: { token: session.token } })
  }
  return NextResponse.json({ ok: true })
}
