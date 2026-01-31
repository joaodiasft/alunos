import { prisma } from "@/lib/prisma"

type LogInput = {
  adminId: string
  acao: string
  entidade: string
  entidadeId?: string
  antes?: unknown
  depois?: unknown
  ip?: string | null
  userAgent?: string | null
}

export async function logAdminAction({
  adminId,
  acao,
  entidade,
  entidadeId,
  antes,
  depois,
  ip,
  userAgent,
}: LogInput) {
  await prisma.logSistema.create({
    data: {
      adminId,
      acao,
      entidade,
      entidadeId,
      antes: antes ? JSON.stringify(antes) : undefined,
      depois: depois ? JSON.stringify(depois) : undefined,
      ip: ip ?? undefined,
      userAgent: userAgent ?? undefined,
    },
  })
}
