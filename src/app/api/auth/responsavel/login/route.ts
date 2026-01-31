import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSessionToken, toPhoneDigits } from "@/lib/auth"

export async function POST(request: Request) {
  const body = (await request.json()) as { nome?: string; telefone?: string }

  if (!body?.nome || !body?.telefone) {
    return NextResponse.json({ message: "Informe nome e telefone." }, { status: 400 })
  }

  const possiveis = await prisma.responsavel.findMany({
    where: {
      nome: { equals: body.nome, mode: "insensitive" },
    },
    include: {
      alunos: true,
    },
  })

  const responsavel = possiveis.find(
    (item) => toPhoneDigits(item.telefone) === toPhoneDigits(body.telefone!)
  )

  if (
    !responsavel ||
    responsavel.alunos.length === 0
  ) {
    return NextResponse.json({ message: "Credenciais inválidas." }, { status: 401 })
  }

  const token = createSessionToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: {
      token,
      role: "RESPONSAVEL",
      responsavelId: responsavel.id,
      expiresAt,
    },
  })

  return NextResponse.json({
    token,
    role: "RESPONSAVEL",
    responsavelId: responsavel.id,
  })
}
