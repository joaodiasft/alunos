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
  let range: { gte: Date; lte: Date } | undefined
  if (month) {
    const [year, monthIndex] = month.split("-").map((value) => Number(value))
    if (year && monthIndex) {
      const start = new Date(year, monthIndex - 1, 1)
      const end = new Date(year, monthIndex, 0, 23, 59, 59)
      range = { gte: start, lte: end }
    }
  }

  const aulas = await prisma.aula.findMany({
    where: range ? { data: range } : undefined,
    include: {
      turma: true,
      professor: true,
      disciplina: true,
    },
    orderBy: { data: "desc" },
  })

  return NextResponse.json(aulas)
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const body = (await request.json()) as {
    turmaId?: string
    data?: string
    disciplinaId?: string
    professorId?: string
  }

  if (!body?.turmaId || !body?.data) {
    return NextResponse.json({ message: "Campos obrigatórios ausentes." }, { status: 400 })
  }

  const aula = await prisma.aula.create({
    data: {
      turmaId: body.turmaId,
      data: new Date(body.data),
      disciplinaId: body.disciplinaId ?? null,
      professorId: body.professorId ?? null,
    },
    include: {
      turma: true,
      professor: true,
      disciplina: true,
    },
  })

  await logAdminAction({
    adminId: session.adminId,
    acao: "CRIAR",
    entidade: "Aula",
    entidadeId: aula.id,
    depois: aula,
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json(aula)
}
