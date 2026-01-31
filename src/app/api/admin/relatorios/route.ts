import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const now = new Date()
  const inicio = startOfMonth(now)
  const fim = endOfMonth(now)

  const [totalAlunosAtivos, totalTurmas, pagamentosMes, mensalidadesMes, frequenciasMes] =
    await Promise.all([
      prisma.aluno.count({ where: { status: "ATIVO" } }),
      prisma.turma.count(),
      prisma.pagamento.findMany({
        where: { data: { gte: inicio, lte: fim } },
      }),
      prisma.mensalidade.findMany({
        where: { vencimento: { gte: inicio, lte: fim } },
      }),
      prisma.frequencia.findMany({
        where: { aula: { data: { gte: inicio, lte: fim } } },
      }),
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
  })
}
