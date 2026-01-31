import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"
import { logAdminAction } from "@/lib/admin-log"

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const turmas = await prisma.turma.findMany({
    include: {
      alunos: { where: { ativo: true }, include: { aluno: true } },
      planoFinanceiro: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(turmas)
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const body = (await request.json()) as {
    nome?: string
    anoLetivo?: number
    turno?: "MANHA" | "TARDE" | "NOITE"
    modalidade?: "PRESENCIAL" | "ONLINE"
    valorMatricula?: number
    valorMensalidade?: number
  }

  if (!body?.nome || !body?.anoLetivo || !body?.turno || !body?.modalidade) {
    return NextResponse.json({ message: "Campos obrigatórios ausentes." }, { status: 400 })
  }

  const turma = await prisma.turma.create({
    data: {
      nome: body.nome,
      anoLetivo: body.anoLetivo,
      turno: body.turno,
      modalidade: body.modalidade,
      planoFinanceiro: body.valorMensalidade
        ? {
            create: {
              valorMatricula: body.valorMatricula ?? 0,
              valorMensalidade: body.valorMensalidade,
            },
          }
        : undefined,
    },
    include: {
      planoFinanceiro: true,
    },
  })

  await logAdminAction({
    adminId: session.adminId,
    acao: "CRIAR",
    entidade: "Turma",
    entidadeId: turma.id,
    depois: turma,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json(turma)
}
