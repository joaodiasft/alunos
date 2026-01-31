import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"
import { logAdminAction } from "@/lib/admin-log"

function calcularDesconto(valorOriginal: number, bolsas: { percentual: number | null; valorFixo: number | null }[]) {
  let desconto = 0
  for (const bolsa of bolsas) {
    if (bolsa.percentual) {
      desconto += Math.round((valorOriginal * bolsa.percentual) / 100)
    }
    if (bolsa.valorFixo) {
      desconto += bolsa.valorFixo
    }
  }
  return Math.min(desconto, valorOriginal)
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const alunoId = searchParams.get("alunoId")
  const turmaId = searchParams.get("turmaId")

  const mensalidades = await prisma.mensalidade.findMany({
    where: { alunoId: alunoId ?? undefined, turmaId: turmaId ?? undefined },
    include: { aluno: true, pagamentos: true, turma: true },
    orderBy: { vencimento: "desc" },
  })

  return NextResponse.json(mensalidades)
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const body = (await request.json()) as {
    turmaId?: string
    referencia?: string
    valorMensalidade?: number
  }

  if (!body?.turmaId || !body?.referencia) {
    return NextResponse.json({ message: "Turma e referência são obrigatórias." }, { status: 400 })
  }

  const turma = await prisma.turma.findUnique({
    where: { id: body.turmaId },
    include: { planoFinanceiro: true, alunos: { where: { ativo: true } } },
  })

  if (!turma) {
    return NextResponse.json({ message: "Turma não encontrada." }, { status: 404 })
  }

  const valorOriginal = body.valorMensalidade ?? turma.planoFinanceiro?.valorMensalidade ?? 0

  const [ano, mes] = body.referencia.split("-").map((item) => Number(item))
  const vencimento = new Date(ano, (mes || 1) - 1, 10)

  const alunosIds = turma.alunos.map((item) => item.alunoId)
  const bolsas = await prisma.bolsaDesconto.findMany({
    where: { alunoId: { in: alunosIds } },
  })

  const mensalidades = await Promise.all(
    alunosIds.map(async (alunoId) => {
      const bolsasDoAluno = bolsas.filter((bolsa) => bolsa.alunoId === alunoId)
      const desconto = calcularDesconto(valorOriginal, bolsasDoAluno)
      const valorFinal = Math.max(valorOriginal - desconto, 0)

      return prisma.mensalidade.upsert({
        where: { id: `${body.referencia}-${alunoId}-${body.turmaId}` },
        update: {
          valorOriginal,
          desconto,
          valorFinal,
          vencimento,
        },
        create: {
          id: `${body.referencia}-${alunoId}-${body.turmaId}`,
          alunoId,
          turmaId: body.turmaId!,
          referencia: body.referencia,
          valorOriginal,
          desconto,
          valorFinal,
          vencimento,
        },
      })
    })
  )

  await logAdminAction({
    adminId: session.adminId,
    acao: "GERAR_MENSALIDADES",
    entidade: "Mensalidade",
    entidadeId: body.referencia,
    depois: { turmaId: body.turmaId, quantidade: mensalidades.length },
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json({ ok: true, mensalidades })
}
