import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"
import { logAdminAction } from "@/lib/admin-log"

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const body = (await request.json()) as { nome?: string }
  const antes = await prisma.disciplina.findUnique({ where: { id: context.params.id } })
  if (!antes) {
    return NextResponse.json({ message: "Disciplina não encontrada." }, { status: 404 })
  }

  const disciplina = await prisma.disciplina.update({
    where: { id: context.params.id },
    data: { nome: body.nome ?? undefined },
  })

  await logAdminAction({
    adminId: session.adminId,
    acao: "ATUALIZAR",
    entidade: "Disciplina",
    entidadeId: disciplina.id,
    antes,
    depois: disciplina,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json(disciplina)
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const antes = await prisma.disciplina.findUnique({ where: { id: context.params.id } })
  if (!antes) {
    return NextResponse.json({ message: "Disciplina não encontrada." }, { status: 404 })
  }

  await prisma.disciplina.delete({ where: { id: context.params.id } })

  await logAdminAction({
    adminId: session.adminId,
    acao: "EXCLUIR",
    entidade: "Disciplina",
    entidadeId: context.params.id,
    antes,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json({ ok: true })
}
