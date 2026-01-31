import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSessionToken, toPhoneDigits } from "@/lib/auth"

export async function POST(request: Request) {
  const body = (await request.json()) as { token?: string; telefone?: string }

  if (!body?.token || !body?.telefone) {
    return NextResponse.json({ message: "Informe token e telefone." }, { status: 400 })
  }

  const aluno = await prisma.aluno.findUnique({
    where: { token: body.token.toUpperCase() },
  })

  if (!aluno || toPhoneDigits(aluno.telefone) !== toPhoneDigits(body.telefone)) {
    return NextResponse.json({ message: "Credenciais inválidas." }, { status: 401 })
  }

  const [turmaAtiva, mensalidadeAprovada] = await Promise.all([
    prisma.alunoTurma.findFirst({
      where: { alunoId: aluno.id, ativo: true },
    }),
    prisma.mensalidade.findFirst({
      where: { alunoId: aluno.id, aprovacao: "APROVADO" },
      orderBy: { vencimento: "desc" },
    }),
  ])

  if (!turmaAtiva || !mensalidadeAprovada) {
    return NextResponse.json(
      { message: "Acesso bloqueado. Aguarde aprovação do pagamento." },
      { status: 403 }
    )
  }

  const token = createSessionToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: {
      token,
      role: "ALUNO",
      alunoId: aluno.id,
      expiresAt,
    },
  })

  return NextResponse.json({
    token,
    role: "ALUNO",
    alunoId: aluno.id,
  })
}
