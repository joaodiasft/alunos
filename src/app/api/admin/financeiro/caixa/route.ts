import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const tipo = searchParams.get("tipo") || undefined
    const categoria = searchParams.get("categoria") || undefined

    let range: { gte: Date; lte: Date } | undefined
    if (month) {
      const [year, monthIndex] = month.split("-").map((value) => Number(value))
      if (year && monthIndex) {
        const start = new Date(year, monthIndex - 1, 1)
        const end = new Date(year, monthIndex, 0, 23, 59, 59)
        range = { gte: start, lte: end }
      }
    }

    const [lancamentos, turmas] = await Promise.all([
      prisma.lancamentoFinanceiro.findMany({
        where: {
          data: range,
          tipo: tipo as any,
          categoria: categoria as any,
        },
        orderBy: { data: "desc" },
      }),
      prisma.turma.findMany({
        include: {
          planoFinanceiro: true,
          alunos: {
            where: {
              ativo: true,
            },
            select: { id: true, inicioEm: true },
          },
        },
      }),
    ])

    const totalMatriculas = turmas.reduce((acc, turma) => {
      const valorMatricula = turma.planoFinanceiro?.valorMatricula ?? 0
      if (!valorMatricula) return acc
      let count = turma.alunos.length
      if (range) {
        count = turma.alunos.filter((alunoTurma) => {
          const inicio = new Date(alunoTurma.inicioEm)
          return inicio >= range.gte && inicio <= range.lte
        }).length
      }
      return acc + valorMatricula * count
    }, 0)

    return NextResponse.json({ lancamentos, totalMatriculas })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar caixa."
    return NextResponse.json({ message }, { status: 500 })
  }
}
