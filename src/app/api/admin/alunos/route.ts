import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"
import { generateAlunoToken } from "@/lib/aluno-token"
import { logAdminAction } from "@/lib/admin-log"

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const incluirInativos = searchParams.get("inativos") === "true"

  const alunos = await prisma.aluno.findMany({
    where: incluirInativos ? undefined : { status: "ATIVO" },
    include: {
      turmas: {
        where: { ativo: true },
        include: { turma: true },
      },
      responsaveis: {
        include: { responsavel: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(alunos)
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const body = (await request.json()) as {
    nome?: string
    dataNascimento?: string
    telefone?: string
    turmaIds?: string[]
    status?: "ATIVO" | "INATIVO"
    contratoAssinado?: boolean
    responsavelNome?: string
    responsavelTelefone?: string
  }

  if (!body?.nome || !body?.dataNascimento || !body?.telefone) {
    return NextResponse.json({ message: "Campos obrigatórios ausentes." }, { status: 400 })
  }

  const token = await generateAlunoToken()

  const aluno = await prisma.aluno.create({
    data: {
      nome: body.nome,
      dataNascimento: new Date(body.dataNascimento),
      telefone: body.telefone,
      token,
      status: body.status ?? "ATIVO",
      contratoAssinado: body.contratoAssinado ?? false,
      turmas: body.turmaIds?.length
        ? {
            create: body.turmaIds.map((turmaId) => ({
              turmaId,
              inicioEm: new Date(),
            })),
          }
        : undefined,
    },
    include: {
      turmas: {
        where: { ativo: true },
        include: { turma: true },
      },
    },
  })

  let responsavelId: string | undefined
  if (body.responsavelNome && body.responsavelTelefone) {
    const existente = await prisma.responsavel.findFirst({
      where: { telefone: body.responsavelTelefone },
    })
    const responsavel = existente
      ? await prisma.responsavel.update({
          where: { id: existente.id },
          data: { nome: body.responsavelNome },
        })
      : await prisma.responsavel.create({
          data: {
            nome: body.responsavelNome,
            telefone: body.responsavelTelefone,
          },
        })
    responsavelId = responsavel.id
    await prisma.responsavelAluno.create({
      data: { responsavelId: responsavel.id, alunoId: aluno.id },
    })
  }

  await logAdminAction({
    adminId: session.adminId,
    acao: "CRIAR",
    entidade: "Aluno",
    entidadeId: aluno.id,
    depois: { aluno, responsavelId },
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json(aluno)
}
