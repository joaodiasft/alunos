import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"
import { logAdminAction } from "@/lib/admin-log"

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const body = (await request.json()) as {
    mensalidadeId?: string
    data?: string
    valorPago?: number
    forma?: "PIX" | "DINHEIRO" | "TRANSFERENCIA" | "CARTAO"
    observacoes?: string
  }

  if (!body?.mensalidadeId || !body?.data || !body?.valorPago) {
    return NextResponse.json({ message: "Dados de pagamento incompletos." }, { status: 400 })
  }

  const pagamento = await prisma.pagamento.create({
    data: {
      mensalidadeId: body.mensalidadeId,
      data: new Date(body.data),
      valorPago: body.valorPago,
      forma: body.forma,
      observacoes: body.observacoes,
    },
  })

  await prisma.mensalidade.update({
    where: { id: body.mensalidadeId },
    data: { status: "PAGO" },
  })

  await logAdminAction({
    adminId: session.adminId,
    acao: "REGISTRAR_PAGAMENTO",
    entidade: "Pagamento",
    entidadeId: pagamento.id,
    depois: pagamento,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json(pagamento)
}
