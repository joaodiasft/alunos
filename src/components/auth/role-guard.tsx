"use client"

import { ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"
import { readSession } from "@/lib/client/session"

type Role = "ADMIN" | "ALUNO" | "RESPONSAVEL"

type RoleGuardProps = {
  allowed: Role[]
  children: ReactNode
}

export function RoleGuard({ allowed, children }: RoleGuardProps) {
  const router = useRouter()

  useEffect(() => {
    const session = readSession()
    if (!session || !allowed.includes(session.role)) {
      router.push("/")
    }
  }, [allowed, router])

  return <>{children}</>
}
