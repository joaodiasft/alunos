import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
}

function startOfIsoWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfIsoWeek(date: Date) {
  const start = startOfIsoWeek(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

function parseIsoWeek(weekValue: string) {
  const [yearPart, weekPart] = weekValue.split("-W")
  const year = Number(yearPart)
  const week = Number(weekPart)
  if (!year || !week) return null
  const simple = new Date(year, 0, 1 + (week - 1) * 7)
  return startOfIsoWeek(simple)
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const period = searchParams.get("period") ?? "month"
  const month = searchParams.get("month")
  const week = searchParams.get("week")
  const turmaId = searchParams.get("turmaId")

  const now = new Date()
  let inicio = startOfMonth(now)
  let fim = endOfMonth(now)

  if (period === "week") {
    const base = week ? parseIsoWeek(week) : startOfIsoWeek(now)
    if (base) {
      inicio = startOfIsoWeek(base)
      fim = endOfIsoWeek(base)
    }
  } else {
    const baseMonth = month ? new Date(`${month}-01T00:00:00`) : now
    inicio = startOfMonth(baseMonth)
    fim = endOfMonth(baseMonth)
  }

  const [
    totalAlunosAtivos,
    totalTurmas,
    pagamentosMes,
    mensalidadesMes,
    frequenciasMes,
    totalAulasMes,
    totalBolsas,
  ] = await Promise.all([
    turmaId
      ? prisma.alunoTurma.count({
          where: { turmaId, ativo: true, aluno: { status: "ATIVO" } },
        })
      : prisma.aluno.count({ where: { status: "ATIVO" } }),
    turmaId ? Promise.resolve(1) : prisma.turma.count(),
    prisma.pagamento.findMany({
      where: {
        data: { gte: inicio, lte: fim },
        mensalidade: turmaId ? { turmaId } : undefined,
      },
    }),
    prisma.mensalidade.findMany({
      where: {
        vencimento: { gte: inicio, lte: fim },
        turmaId: turmaId ?? undefined,
      },
    }),
    prisma.frequencia.findMany({
      where: {
        aula: {
          data: { gte: inicio, lte: fim },
          turmaId: turmaId ?? undefined,
        },
      },
    }),
    prisma.aula.count({
      where: {
        data: { gte: inicio, lte: fim },
        turmaId: turmaId ?? undefined,
      },
    }),
    prisma.bolsaDesconto.count(),
  ])

  const totalRecebidoMes = pagamentosMes.reduce((acc, item) => acc + item.valorPago, 0)
  const pendentesMes = mensalidadesMes.filter(
    (item) => item.status !== "PAGO" && item.aprovacao !== "RECUSADO"
  )
  const totalPendenteMes = pendentesMes.reduce((acc, item) => acc + item.valorFinal, 0)

  const frequenciasPresentes = frequenciasMes.filter((f) => f.status === "PRESENTE").length
  const frequenciasTotal = frequenciasMes.length || 1
  const presencaMediaMes = frequenciasPresentes / frequenciasTotal

  const inadimplenciaQuantidade = pendentesMes.length
  const inadimplenciaValor = totalPendenteMes

  return NextResponse.json({
    totalAlunosAtivos,
    totalTurmas,
    presencaMediaMes,
    totalRecebidoMes,
    totalPendenteMes,
    inadimplenciaQuantidade,
    inadimplenciaValor,
    totalPagamentosMes: pagamentosMes.length,
    totalMensalidadesMes: mensalidadesMes.length,
    totalAulasMes,
    totalBolsas,
  })
}
