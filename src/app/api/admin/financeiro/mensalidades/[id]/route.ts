import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api-auth"
import { logAdminAction } from "@/lib/admin-log"

export async function PATCH(
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
    return NextResponse.json({ message: "ID da mensalidade ausente." }, { status: 400 })
  }

  const body = (await request.json()) as { aprovacao?: "APROVADO" | "RECUSADO" }
  if (!body?.aprovacao) {
    return NextResponse.json({ message: "Informe a decisão." }, { status: 400 })
  }

  const antes = await prisma.mensalidade.findUnique({ where: { id } })
  if (!antes) {
    return NextResponse.json({ message: "Mensalidade não encontrada." }, { status: 404 })
  }

  const mensalidade = await prisma.mensalidade.update({
    where: { id },
    data: { aprovacao: body.aprovacao },
  })

  if (body.aprovacao === "RECUSADO") {
    await prisma.alunoTurma.updateMany({
      where: {
        alunoId: mensalidade.alunoId,
        turmaId: mensalidade.turmaId,
        ativo: true,
      },
      data: { ativo: false, fimEm: new Date() },
    })
  }

  if (body.aprovacao === "APROVADO") {
    const vinculada = await prisma.alunoTurma.findFirst({
      where: { alunoId: mensalidade.alunoId, turmaId: mensalidade.turmaId },
    })
    if (vinculada) {
      await prisma.alunoTurma.update({
        where: { id: vinculada.id },
        data: { ativo: true, fimEm: null },
      })
    } else {
      await prisma.alunoTurma.create({
        data: {
          alunoId: mensalidade.alunoId,
          turmaId: mensalidade.turmaId,
          inicioEm: new Date(),
          ativo: true,
        },
      })
    }
  }

  await logAdminAction({
    adminId: session.adminId,
    acao: "APROVAR_RECUSAR_MENSALIDADE",
    entidade: "Mensalidade",
    entidadeId: mensalidade.id,
    antes,
    depois: mensalidade,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json(mensalidade)
}
