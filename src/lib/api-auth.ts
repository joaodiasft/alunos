import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export type AuthSession = {
  role: "ADMIN" | "ALUNO" | "RESPONSAVEL"
  adminId?: string | null
  alunoId?: string | null
  responsavelId?: string | null
  token: string
}

function readBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim()
  }
  return request.headers.get("x-session-token")?.trim() ?? null
}

export async function getSession(request: NextRequest) {
  const token = readBearerToken(request)
  if (!token) return null

  const session = await prisma.session.findUnique({ where: { token } })
  if (!session) return null

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } })
    return null
  }

  return {
    role: session.role,
    adminId: session.adminId,
    alunoId: session.alunoId,
    responsavelId: session.responsavelId,
    token,
  } satisfies AuthSession
}

export async function requireAdmin(request: NextRequest) {
  const session = await getSession(request)
  if (!session || session.role !== "ADMIN") {
    return null
  }
  return session
}

export async function requireAluno(request: NextRequest) {
  const session = await getSession(request)
  if (!session || session.role !== "ALUNO") {
    return null
  }
  return session
}

export async function requireResponsavel(request: NextRequest) {
  const session = await getSession(request)
  if (!session || session.role !== "RESPONSAVEL") {
    return null
  }
  return session
}
