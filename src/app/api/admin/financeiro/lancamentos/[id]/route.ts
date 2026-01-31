import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"
import { logAdminAction } from "@/lib/admin-log"

async function getIdFromContext(
  request: NextRequest,
  context: { params?: Promise<{ id: string }> }
) {
  if (context.params) {
    const resolved = await context.params
    if (resolved?.id) return resolved.id
  }
  const parts = request.nextUrl.pathname.split("/")
  return parts[parts.length - 1]
}

export async function PUT(
  request: NextRequest,
  context: { params?: Promise<{ id: string }> }
) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const id = await getIdFromContext(request, context)
  if (!id) {
    return NextResponse.json({ message: "ID inválido." }, { status: 400 })
  }

  const body = (await request.json()) as {
    tipo?: "ENTRADA" | "SAIDA"
    categoria?: "FIXA" | "VARIAVEL"
    descricao?: string
    valor?: number
    data?: string
    observacoes?: string
  }

  if (!body?.tipo || !body?.categoria || !body?.descricao || !body?.valor || !body?.data) {
    return NextResponse.json({ message: "Campos obrigatórios ausentes." }, { status: 400 })
  }

  const lancamento = await prisma.lancamentoFinanceiro.update({
    where: { id },
    data: {
      tipo: body.tipo,
      categoria: body.categoria,
      descricao: body.descricao,
      valor: body.valor,
      data: new Date(body.data),
      observacoes: body.observacoes?.trim() || null,
    },
  })

  await logAdminAction({
    adminId: session.adminId,
    acao: "ATUALIZAR",
    entidade: "LancamentoFinanceiro",
    entidadeId: lancamento.id,
    depois: lancamento,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json(lancamento)
}

export async function DELETE(
  request: NextRequest,
  context: { params?: Promise<{ id: string }> }
) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const id = await getIdFromContext(request, context)
  if (!id) {
    return NextResponse.json({ message: "ID inválido." }, { status: 400 })
  }

  const lancamento = await prisma.lancamentoFinanceiro.delete({ where: { id } })

  await logAdminAction({
    adminId: session.adminId,
    acao: "EXCLUIR",
    entidade: "LancamentoFinanceiro",
    entidadeId: lancamento.id,
    antes: lancamento,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json({ ok: true })
}
