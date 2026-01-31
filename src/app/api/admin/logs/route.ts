import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const logs = await prisma.logSistema.findMany({
    include: { admin: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  return NextResponse.json(logs)
}
