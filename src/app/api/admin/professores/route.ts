import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"
import { logAdminAction } from "@/lib/admin-log"

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const professores = await prisma.professor.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(professores)
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const body = (await request.json()) as { nome?: string; email?: string; telefone?: string }
  if (!body?.nome) {
    return NextResponse.json({ message: "Informe o nome." }, { status: 400 })
  }

  const professor = await prisma.professor.create({
    data: { nome: body.nome, email: body.email, telefone: body.telefone },
  })

  await logAdminAction({
    adminId: session.adminId,
    acao: "CRIAR",
    entidade: "Professor",
    entidadeId: professor.id,
    depois: professor,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json(professor)
}
