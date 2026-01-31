import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"
import { logAdminAction } from "@/lib/admin-log"

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const body = (await request.json()) as {
    nome?: string
    telefone?: string
    alunoId?: string
  }

  const antes = await prisma.responsavel.findUnique({
    where: { id: context.params.id },
    include: { alunos: true },
  })

  if (!antes) {
    return NextResponse.json({ message: "Responsável não encontrado." }, { status: 404 })
  }

  const responsavel = await prisma.responsavel.update({
    where: { id: context.params.id },
    data: {
      nome: body.nome ?? undefined,
      telefone: body.telefone ?? undefined,
    },
  })

  if (body.alunoId) {
    await prisma.responsavelAluno.upsert({
      where: { responsavelId_alunoId: { responsavelId: responsavel.id, alunoId: body.alunoId } },
      update: {},
      create: { responsavelId: responsavel.id, alunoId: body.alunoId },
    })
  }

  await logAdminAction({
    adminId: session.adminId,
    acao: "ATUALIZAR",
    entidade: "Responsavel",
    entidadeId: responsavel.id,
    antes,
    depois: responsavel,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json(responsavel)
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const antes = await prisma.responsavel.findUnique({ where: { id: context.params.id } })
  if (!antes) {
    return NextResponse.json({ message: "Responsável não encontrado." }, { status: 404 })
  }

  await prisma.responsavel.delete({ where: { id: context.params.id } })

  await logAdminAction({
    adminId: session.adminId,
    acao: "EXCLUIR",
    entidade: "Responsavel",
    entidadeId: context.params.id,
    antes,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json({ ok: true })
}
