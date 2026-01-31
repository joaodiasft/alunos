import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSessionToken, hashPassword, verifyPassword } from "@/lib/auth"

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; senha?: string; token?: string }

  if (!body?.email || !body?.senha || !body?.token) {
    return NextResponse.json({ message: "Informe email, senha e token." }, { status: 400 })
  }

  if (body.token !== "redas2026") {
    return NextResponse.json({ message: "Token de confirmação inválido." }, { status: 401 })
  }

  let admin = await prisma.adminUser.findFirst({
    where: { email: { equals: body.email, mode: "insensitive" } },
  })
  if (!admin) {
    const emailNormalizado = body.email.toLowerCase()
    if (emailNormalizado !== "redas@rmil.com") {
      return NextResponse.json({ message: "Credenciais inválidas." }, { status: 401 })
    }
    admin = await prisma.adminUser.create({
      data: {
        email: emailNormalizado,
        nome: "Admin RMIL",
        senhaHash: await hashPassword(body.senha),
        ativo: true,
      },
    })
  }
  if (!admin.ativo) {
    return NextResponse.json({ message: "Usuário inativo." }, { status: 401 })
  }

  const ok = await verifyPassword(body.senha, admin.senhaHash)
  if (!ok) {
    return NextResponse.json({ message: "Credenciais inválidas." }, { status: 401 })
  }

  const token = createSessionToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: {
      token,
      role: "ADMIN",
      adminId: admin.id,
      expiresAt,
    },
  })

  return NextResponse.json({
    token,
    role: "ADMIN",
    adminId: admin.id,
  })
}
