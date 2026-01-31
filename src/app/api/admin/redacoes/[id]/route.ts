import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"
import { logAdminAction } from "@/lib/admin-log"

function getIdFromRequest(request: NextRequest, params?: { id?: string }) {
  if (params?.id) return params.id
  const parts = request.nextUrl.pathname.split("/")
  return parts[parts.length - 1]
}

export async function PUT(request: NextRequest, context: { params?: { id?: string } }) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const id = getIdFromRequest(request, context.params)
  if (!id) {
    return NextResponse.json({ message: "ID inválido." }, { status: 400 })
  }

  const body = (await request.json()) as {
    turmaId?: string | null
    referencia?: string
    competencia1?: number
    competencia2?: number
    competencia3?: number
    competencia4?: number
    competencia5?: number
    observacoes?: string
  }

  const competencias = [
    body.competencia1 ?? 0,
    body.competencia2 ?? 0,
    body.competencia3 ?? 0,
    body.competencia4 ?? 0,
    body.competencia5 ?? 0,
  ]
  const total = competencias.reduce((acc, val) => acc + val, 0)

  const redacao = await prisma.redacaoNota.update({
    where: { id },
    data: {
      turmaId: body.turmaId ?? null,
      referencia: body.referencia,
      competencia1: body.competencia1 ?? 0,
      competencia2: body.competencia2 ?? 0,
      competencia3: body.competencia3 ?? 0,
      competencia4: body.competencia4 ?? 0,
      competencia5: body.competencia5 ?? 0,
      total,
      observacoes: body.observacoes?.trim() || null,
    },
    include: { aluno: true, turma: true },
  })

  await logAdminAction({
    adminId: session.adminId,
    acao: "ATUALIZAR",
    entidade: "RedacaoNota",
    entidadeId: redacao.id,
    depois: redacao,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json(redacao)
}

export async function DELETE(request: NextRequest, context: { params?: { id?: string } }) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const id = getIdFromRequest(request, context.params)
  if (!id) {
    return NextResponse.json({ message: "ID inválido." }, { status: 400 })
  }

  const redacao = await prisma.redacaoNota.delete({ where: { id } })

  await logAdminAction({
    adminId: session.adminId,
    acao: "EXCLUIR",
    entidade: "RedacaoNota",
    entidadeId: redacao.id,
    antes: redacao,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json({ ok: true })
}
