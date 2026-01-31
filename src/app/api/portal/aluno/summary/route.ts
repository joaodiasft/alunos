import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAluno } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  const session = await requireAluno(request)
  if (!session?.alunoId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const aluno = await prisma.aluno.findUnique({
    where: { id: session.alunoId },
    include: {
      turmas: { where: { ativo: true }, include: { turma: true } },
    },
  })

  if (!aluno) {
    return NextResponse.json({ message: "Aluno não encontrado." }, { status: 404 })
  }

  const turmasIds = aluno.turmas.map((item) => item.turmaId)
  const hoje = new Date()

  const [frequencias, mensalidades, avisos] = await Promise.all([
    prisma.frequencia.findMany({
      where: { alunoId: aluno.id },
      include: { aula: { include: { disciplina: true } } },
    }),
    prisma.mensalidade.findMany({
      where: { alunoId: aluno.id },
      include: { pagamentos: true, turma: true },
      orderBy: { vencimento: "desc" },
    }),
    prisma.aviso.findMany({
      where: turmasIds.length
        ? {
            OR: [{ alunoId: aluno.id }, { turmaId: { in: turmasIds } }],
          }
        : { alunoId: aluno.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  const referenciasPagas = mensalidades
    .filter((item) => item.status === "PAGO")
    .map((item) => item.referencia)
  const referenciaAtual = referenciasPagas[0] ?? `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`
  const [ano, mes] = referenciaAtual.split("-").map((item) => Number(item))
  const inicioMes = new Date(ano, (mes || 1) - 1, 1)
  const fimMes = new Date(ano, (mes || 1) - 1 + 1, 0, 23, 59, 59)

  const aulas = await prisma.aula.findMany({
    where: {
      turmaId: turmasIds.length ? { in: turmasIds } : undefined,
      data: { gte: inicioMes, lte: fimMes },
    },
    include: { disciplina: true, professor: true, turma: true },
    orderBy: { data: "asc" },
  })

  const total = frequencias.length || 1
  const presentes = frequencias.filter((item) => item.status === "PRESENTE").length

  const porDisciplina = frequencias.reduce<Record<string, { disciplina: string; total: number; presentes: number }>>(
    (acc, item) => {
      const disciplina = item.aula.disciplina?.nome ?? "Sem disciplina"
      if (!acc[disciplina]) {
        acc[disciplina] = { disciplina, total: 0, presentes: 0 }
      }
      acc[disciplina].total += 1
      if (item.status === "PRESENTE") acc[disciplina].presentes += 1
      return acc
    },
    {}
  )

  return NextResponse.json({
    aluno,
    aulas,
    referenciaAtual,
    avisos,
    frequencia: {
      total,
      presentes,
      percentual: presentes / total,
      porDisciplina: Object.values(porDisciplina),
    },
    financeiro: mensalidades,
  })
}
