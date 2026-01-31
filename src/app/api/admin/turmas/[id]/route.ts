import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"
import { logAdminAction } from "@/lib/admin-log"

export async function PUT(request: NextRequest, context: { params: { id?: string } }) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const id = context.params?.id ?? request.nextUrl.pathname.split("/").pop()
  if (!id) {
    return NextResponse.json({ message: "ID da turma ausente." }, { status: 400 })
  }

  const body = (await request.json()) as {
    nome?: string
    anoLetivo?: number
    turno?: "MANHA" | "TARDE" | "NOITE"
    modalidade?: "PRESENCIAL" | "ONLINE"
    valorMatricula?: number
    valorMensalidade?: number
  }
  if (body.anoLetivo !== undefined && Number.isNaN(body.anoLetivo)) {
    return NextResponse.json({ message: "Ano letivo inválido." }, { status: 400 })
  }
  if (body.nome !== undefined && body.nome.trim().length === 0) {
    return NextResponse.json({ message: "Nome inválido." }, { status: 400 })
  }

  const turmaAntes = await prisma.turma.findUnique({
    where: { id },
    include: { planoFinanceiro: true },
  })

  if (!turmaAntes) {
    return NextResponse.json({ message: "Turma não encontrada." }, { status: 404 })
  }

  const turma = await prisma.turma.update({
    where: { id },
    data: {
      nome: body.nome ?? undefined,
      anoLetivo: body.anoLetivo ?? undefined,
      turno: body.turno ?? undefined,
      modalidade: body.modalidade ?? undefined,
      planoFinanceiro:
        body.valorMensalidade !== undefined || body.valorMatricula !== undefined
          ? {
              upsert: {
                create: {
                  valorMatricula: body.valorMatricula ?? 0,
                  valorMensalidade: body.valorMensalidade ?? 0,
                },
                update: {
                  valorMatricula: body.valorMatricula ?? undefined,
                  valorMensalidade: body.valorMensalidade ?? undefined,
                },
              },
            }
          : undefined,
    },
    include: { planoFinanceiro: true },
  })

  await logAdminAction({
    adminId: session.adminId,
    acao: "ATUALIZAR",
    entidade: "Turma",
    entidadeId: turma.id,
    antes: turmaAntes,
    depois: turma,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json(turma)
}

export async function DELETE(request: NextRequest, context: { params: { id?: string } }) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const id = context.params?.id ?? request.nextUrl.pathname.split("/").pop()
  if (!id) {
    return NextResponse.json({ message: "ID da turma ausente." }, { status: 400 })
  }

  const turmaAntes = await prisma.turma.findUnique({ where: { id } })
  if (!turmaAntes) {
    return NextResponse.json({ message: "Turma não encontrada." }, { status: 404 })
  }

  await prisma.turma.delete({ where: { id } })

  await logAdminAction({
    adminId: session.adminId,
    acao: "EXCLUIR",
    entidade: "Turma",
    entidadeId: turmaAntes.id,
    antes: turmaAntes,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json({ ok: true })
}
