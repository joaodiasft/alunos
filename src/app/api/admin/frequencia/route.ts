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
  const turmaId = searchParams.get("turmaId")
  const alunoId = searchParams.get("alunoId")
  const disciplinaId = searchParams.get("disciplinaId")
  const aulaId = searchParams.get("aulaId")

  const frequencias = await prisma.frequencia.findMany({
    where: {
      aulaId: aulaId ?? undefined,
      alunoId: alunoId ?? undefined,
      aula: {
        turmaId: turmaId ?? undefined,
        disciplinaId: disciplinaId ?? undefined,
      },
    },
    include: {
      aula: { include: { disciplina: true, turma: true } },
      aluno: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(frequencias)
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const body = (await request.json()) as {
    aulaId?: string
    registros?: { alunoId: string; status: "PRESENTE" | "FALTA" | "JUSTIFICADA" }[]
  }

  if (!body?.aulaId || !body?.registros?.length) {
    return NextResponse.json({ message: "Dados de frequência inválidos." }, { status: 400 })
  }

  const registros = await Promise.all(
    body.registros.map((registro) =>
      prisma.frequencia.upsert({
        where: { aulaId_alunoId: { aulaId: body.aulaId!, alunoId: registro.alunoId } },
        update: { status: registro.status },
        create: {
          aulaId: body.aulaId!,
          alunoId: registro.alunoId,
          status: registro.status,
        },
      })
    )
  )

  await logAdminAction({
    adminId: session.adminId,
    acao: "LANÇAR_FREQUENCIA",
    entidade: "Frequencia",
    entidadeId: body.aulaId,
    depois: registros,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json({ ok: true, registros })
}
