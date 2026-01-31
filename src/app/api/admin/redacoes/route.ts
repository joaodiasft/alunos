import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"
import { logAdminAction } from "@/lib/admin-log"

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const alunoId = searchParams.get("alunoId") || undefined
  const turmaId = searchParams.get("turmaId") || undefined
  const referencia = searchParams.get("referencia") || undefined

  const redacoes = await prisma.redacaoNota.findMany({
    where: {
      alunoId,
      turmaId,
      referencia,
    },
    include: { aluno: true, turma: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(redacoes)
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const body = (await request.json()) as {
    alunoId?: string
    turmaId?: string
    referencia?: string
    competencia1?: number
    competencia2?: number
    competencia3?: number
    competencia4?: number
    competencia5?: number
    observacoes?: string
  }

  if (!body?.alunoId || !body?.referencia) {
    return NextResponse.json({ message: "Aluno e referência são obrigatórios." }, { status: 400 })
  }

  const competencias = [
    body.competencia1 ?? 0,
    body.competencia2 ?? 0,
    body.competencia3 ?? 0,
    body.competencia4 ?? 0,
    body.competencia5 ?? 0,
  ]
  const total = competencias.reduce((acc, val) => acc + val, 0)

  const redacao = await prisma.redacaoNota.create({
    data: {
      alunoId: body.alunoId,
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
    acao: "CRIAR",
    entidade: "RedacaoNota",
    entidadeId: redacao.id,
    depois: redacao,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json(redacao)
}
