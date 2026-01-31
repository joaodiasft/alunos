import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"
import { logAdminAction } from "@/lib/admin-log"

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

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

  const lancamentos = await prisma.lancamentoFinanceiro.findMany({
    where: {
      data: range,
      tipo: tipo as any,
      categoria: categoria as any,
    },
    orderBy: { data: "desc" },
  })

  return NextResponse.json(lancamentos)
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
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

  const lancamento = await prisma.lancamentoFinanceiro.create({
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
    acao: "CRIAR",
    entidade: "LancamentoFinanceiro",
    entidadeId: lancamento.id,
    depois: lancamento,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json(lancamento)
}
