import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"
import { logAdminAction } from "@/lib/admin-log"

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const bolsas = await prisma.bolsaDesconto.findMany({
    include: { aluno: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(bolsas)
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const body = (await request.json()) as {
    alunoId?: string
    tipo?: string
    percentual?: number
    valorFixo?: number
  }

  if (!body?.alunoId || !body?.tipo) {
    return NextResponse.json({ message: "Aluno e tipo são obrigatórios." }, { status: 400 })
  }

  const bolsa = await prisma.bolsaDesconto.create({
    data: {
      alunoId: body.alunoId,
      tipo: body.tipo,
      percentual: body.percentual ?? null,
      valorFixo: body.valorFixo ?? null,
    },
  })

  await logAdminAction({
    adminId: session.adminId,
    acao: "CRIAR",
    entidade: "BolsaDesconto",
    entidadeId: bolsa.id,
    depois: bolsa,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json(bolsa)
}
