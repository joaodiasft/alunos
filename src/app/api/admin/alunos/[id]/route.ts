import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"
import { logAdminAction } from "@/lib/admin-log"

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const params = await context.params
  const id = params?.id ?? request.nextUrl.pathname.split("/").pop()
  if (!id) {
    return NextResponse.json({ message: "ID do aluno ausente." }, { status: 400 })
  }

  const body = (await request.json()) as {
    nome?: string
    dataNascimento?: string
    telefone?: string
    status?: "ATIVO" | "INATIVO"
    turmaId?: string
    turmaIds?: string[]
    contratoAssinado?: boolean
  }

  const alunoAntes = await prisma.aluno.findUnique({
    where: { id },
    include: { turmas: { where: { ativo: true } } },
  })

  if (!alunoAntes) {
    return NextResponse.json({ message: "Aluno não encontrado." }, { status: 404 })
  }

  const aluno = await prisma.aluno.update({
    where: { id },
    data: {
      nome: body.nome ?? undefined,
      dataNascimento: body.dataNascimento ? new Date(body.dataNascimento) : undefined,
      telefone: body.telefone ?? undefined,
      status: body.status ?? undefined,
      contratoAssinado: body.contratoAssinado ?? undefined,
    },
  })

  const turmaIds = body.turmaIds?.length ? body.turmaIds : body.turmaId ? [body.turmaId] : []
  if (turmaIds.length) {
    const atuais = await prisma.alunoTurma.findMany({
      where: { alunoId: aluno.id, ativo: true },
    })
    const atuaisIds = atuais.map((item) => item.turmaId)
    const remover = atuais.filter((item) => !turmaIds.includes(item.turmaId))
    const adicionar = turmaIds.filter((turmaId) => !atuaisIds.includes(turmaId))

    await prisma.$transaction([
      ...remover.map((item) =>
        prisma.alunoTurma.update({
          where: { id: item.id },
          data: { ativo: false, fimEm: new Date() },
        })
      ),
      ...adicionar.map((turmaId) =>
        prisma.alunoTurma.create({
          data: { alunoId: aluno.id, turmaId, inicioEm: new Date(), ativo: true },
        })
      ),
    ])
  }

  await logAdminAction({
    adminId: session.adminId,
    acao: "ATUALIZAR",
    entidade: "Aluno",
    entidadeId: aluno.id,
    antes: alunoAntes,
    depois: aluno,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json(aluno)
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const params = await context.params
  const id = params?.id ?? request.nextUrl.pathname.split("/").pop()
  if (!id) {
    return NextResponse.json({ message: "ID do aluno ausente." }, { status: 400 })
  }

  const alunoAntes = await prisma.aluno.findUnique({ where: { id } })
  if (!alunoAntes) {
    return NextResponse.json({ message: "Aluno não encontrado." }, { status: 404 })
  }

  const aluno = await prisma.aluno.update({
    where: { id },
    data: { status: "INATIVO" },
  })

  await logAdminAction({
    adminId: session.adminId,
    acao: "INATIVAR",
    entidade: "Aluno",
    entidadeId: aluno.id,
    antes: alunoAntes,
    depois: aluno,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json({ ok: true })
}
