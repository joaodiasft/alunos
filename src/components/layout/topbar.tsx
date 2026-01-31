"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { clearSession, readSession } from "@/lib/client/session"

export function Topbar() {
  const router = useRouter()
  const [sessionRole, setSessionRole] = useState("Visitante")

  useEffect(() => {
    const session = readSession()
    setSessionRole(session?.role ?? "Visitante")
  }, [])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    clearSession()
    router.push("/")
  }

  return (
    <header className="flex items-center justify-between border-b border-border bg-card/90 px-6 py-4 shadow-sm backdrop-blur">
      <div>
        <div className="text-sm text-muted-foreground">Acesso</div>
        <div className="text-base font-medium">{sessionRole}</div>
      </div>
      <Button variant="outline" onClick={handleLogout}>
        Sair
      </Button>
    </header>
  )
}
