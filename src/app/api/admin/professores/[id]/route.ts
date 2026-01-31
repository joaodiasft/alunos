import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"
import { logAdminAction } from "@/lib/admin-log"

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const body = (await request.json()) as { nome?: string; email?: string; telefone?: string }

  const antes = await prisma.professor.findUnique({ where: { id: context.params.id } })
  if (!antes) {
    return NextResponse.json({ message: "Professor não encontrado." }, { status: 404 })
  }

  const professor = await prisma.professor.update({
    where: { id: context.params.id },
    data: { nome: body.nome, email: body.email, telefone: body.telefone },
  })

  await logAdminAction({
    adminId: session.adminId,
    acao: "ATUALIZAR",
    entidade: "Professor",
    entidadeId: professor.id,
    antes,
    depois: professor,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json(professor)
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const antes = await prisma.professor.findUnique({ where: { id: context.params.id } })
  if (!antes) {
    return NextResponse.json({ message: "Professor não encontrado." }, { status: 404 })
  }

  await prisma.professor.delete({ where: { id: context.params.id } })

  await logAdminAction({
    adminId: session.adminId,
    acao: "EXCLUIR",
    entidade: "Professor",
    entidadeId: context.params.id,
    antes,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json({ ok: true })
}
