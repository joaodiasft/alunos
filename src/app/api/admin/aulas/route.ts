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
    datas?: string[]
    disciplinaId?: string
    professorId?: string
    entradas?: { disciplinaId?: string; professorId?: string }[]
  }

  const datas = body.datas?.length ? body.datas : body.data ? [body.data] : []
  if (!body?.turmaId || datas.length === 0) {
    return NextResponse.json({ message: "Campos obrigatórios ausentes." }, { status: 400 })
  }

  const entradas =
    body.entradas?.length
      ? body.entradas
      : [
          {
            disciplinaId: body.disciplinaId ?? null,
            professorId: body.professorId ?? null,
          },
        ]

  const criadas = await Promise.all(
    datas.flatMap((data) =>
      entradas.map((entrada) =>
        prisma.aula.create({
          data: {
            turmaId: body.turmaId!,
            data: new Date(data),
            disciplinaId: entrada.disciplinaId ?? null,
            professorId: entrada.professorId ?? null,
          },
          include: {
            turma: true,
            professor: true,
            disciplina: true,
          },
        })
      )
    )
  )

  await logAdminAction({
    adminId: session.adminId,
    acao: "CRIAR",
    entidade: "Aula",
    entidadeId: body.turmaId,
    depois: { total: criadas.length },
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json({ ok: true, aulas: criadas })
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session?.adminId) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  const aulas = await prisma.aula.findMany({
    select: { id: true, turmaId: true, data: true, disciplinaId: true, professorId: true },
    orderBy: { createdAt: "asc" },
  })

  const duplicadas: string[] = []
  const seen = new Map<string, string>()
  for (const aula of aulas) {
    const key = [
      aula.turmaId,
      aula.data.toISOString(),
      aula.disciplinaId ?? "null",
      aula.professorId ?? "null",
    ].join("|")
    if (seen.has(key)) {
      duplicadas.push(aula.id)
    } else {
      seen.set(key, aula.id)
    }
  }

  if (duplicadas.length) {
    await prisma.aula.deleteMany({ where: { id: { in: duplicadas } } })
  }

  await logAdminAction({
    adminId: session.adminId,
    acao: "EXCLUIR",
    entidade: "AulaDuplicada",
    entidadeId: String(duplicadas.length),
    depois: { removidas: duplicadas.length },
    ip: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  })

  return NextResponse.json({ ok: true, removidas: duplicadas.length })
}
