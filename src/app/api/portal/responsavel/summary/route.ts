import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireResponsavel } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  const session = await requireResponsavel(request)
  if (!session?.responsavelId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const responsavel = await prisma.responsavel.findUnique({
    where: { id: session.responsavelId },
    include: {
      alunos: {
        include: {
          aluno: {
            include: {
              turmas: { where: { ativo: true }, include: { turma: true } },
            },
          },
        },
      },
    },
  })

  if (!responsavel) {
    return NextResponse.json({ message: "Responsável não encontrado." }, { status: 404 })
  }

  const alunosIds = responsavel.alunos.map((item) => item.alunoId)
  const [mensalidades, redacoes] = await Promise.all([
    prisma.mensalidade.findMany({
      where: { alunoId: { in: alunosIds } },
      include: { pagamentos: true, aluno: true },
      orderBy: { vencimento: "desc" },
    }),
    prisma.redacaoNota.findMany({
      where: { alunoId: { in: alunosIds } },
      include: { aluno: true, turma: true },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return NextResponse.json({
    responsavel,
    alunos: responsavel.alunos.map((item) => item.aluno),
    financeiro: mensalidades,
    redacoes,
  })
}
