import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"
import { logAdminAction } from "@/lib/admin-log"

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const responsaveis = await prisma.responsavel.findMany({
    include: { alunos: { include: { aluno: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(responsaveis)
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const body = (await request.json()) as {
    nome?: string
    telefone?: string
    alunoId?: string
  }

  if (!body?.nome || !body?.telefone) {
    return NextResponse.json({ message: "Nome e telefone são obrigatórios." }, { status: 400 })
  }

  const responsavel = await prisma.responsavel.create({
    data: {
      nome: body.nome,
      telefone: body.telefone,
      alunos: body.alunoId
        ? {
            create: {
              alunoId: body.alunoId,
            },
          }
        : undefined,
    },
  })

  await logAdminAction({
    adminId: session.adminId,
    acao: "CRIAR",
    entidade: "Responsavel",
    entidadeId: responsavel.id,
    depois: responsavel,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json(responsavel)
}
