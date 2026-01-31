"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/alunos", label: "Alunos" },
  { href: "/admin/turmas", label: "Turmas" },
  { href: "/admin/professores", label: "Professores" },
  { href: "/admin/disciplinas", label: "Disciplinas" },
  { href: "/admin/responsaveis", label: "Responsáveis" },
  { href: "/admin/aulas", label: "Aulas" },
  { href: "/admin/frequencia", label: "Frequência" },
  { href: "/admin/redacoes", label: "Redação" },
  { href: "/admin/financeiro", label: "Financeiro" },
  { href: "/admin/relatorios", label: "Relatórios" },
  { href: "/admin/logs", label: "Logs" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card/95 shadow-sm">
      <div className="px-6 py-6">
        <div className="text-lg font-semibold">RMIL Gestão Escolar</div>
        <div className="text-sm text-muted-foreground">Painel administrativo</div>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {items.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition",
                active
                  ? "border-l-2 border-primary bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
