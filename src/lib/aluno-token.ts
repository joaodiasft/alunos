import { prisma } from "@/lib/prisma"

function toToken(value: number) {
  return `R${String(value).padStart(3, "0")}`
}

export async function generateAlunoToken() {
  const last = await prisma.aluno.findMany({
    select: { token: true },
    orderBy: { token: "desc" },
    take: 1,
  })

  const lastToken = last[0]?.token ?? "R000"
  const numeric = Number(lastToken.replace(/[^\d]/g, "")) || 0
  return toToken(numeric + 1)
}
