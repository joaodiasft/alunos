import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"
import { logAdminAction } from "@/lib/admin-log"

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const disciplinas = await prisma.disciplina.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(disciplinas)
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const body = (await request.json()) as { nome?: string }
  if (!body?.nome) {
    return NextResponse.json({ message: "Informe o nome." }, { status: 400 })
  }

  const disciplina = await prisma.disciplina.create({
    data: { nome: body.nome },
  })

  await logAdminAction({
    adminId: session.adminId,
    acao: "CRIAR",
    entidade: "Disciplina",
    entidadeId: disciplina.id,
    depois: disciplina,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json(disciplina)
}
