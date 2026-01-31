import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"
import { logAdminAction } from "@/lib/admin-log"

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const body = (await request.json()) as { nome?: string; email?: string; telefone?: string }

  const params = await context.params
  const antes = await prisma.professor.findUnique({ where: { id: params.id } })
  if (!antes) {
    return NextResponse.json({ message: "Professor não encontrado." }, { status: 404 })
  }

  const professor = await prisma.professor.update({
    where: { id: params.id },
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

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const params = await context.params
  const antes = await prisma.professor.findUnique({ where: { id: params.id } })
  if (!antes) {
    return NextResponse.json({ message: "Professor não encontrado." }, { status: 404 })
  }

  await prisma.professor.delete({ where: { id: params.id } })

  await logAdminAction({
    adminId: session.adminId,
    acao: "EXCLUIR",
    entidade: "Professor",
    entidadeId: params.id,
    antes,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json({ ok: true })
}
