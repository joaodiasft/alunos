"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/client/api"
import { formatCurrency, formatPercent } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/dashboard/stat-card"

type Relatorio = {
  totalAlunosAtivos: number
  totalTurmas: number
  presencaMediaMes: number
  totalRecebidoMes: number
  totalPendenteMes: number
  inadimplenciaQuantidade: number
  inadimplenciaValor: number
}

export default function AdminRelatoriosPage() {
  const [data, setData] = useState<Relatorio | null>(null)

  useEffect(() => {
    apiFetch<Relatorio>("/api/admin/relatorios").then(setData).catch(() => setData(null))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">
          Indicadores acadêmicos e financeiros do período atual.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Presença média" value={data ? formatPercent(data.presencaMediaMes) : "-"} />
        <StatCard title="Total recebido" value={data ? formatCurrency(data.totalRecebidoMes) : "-"} />
        <StatCard title="Total pendente" value={data ? formatCurrency(data.totalPendenteMes) : "-"} />
        <StatCard
          title="Inadimplência"
          value={data ? `${data.inadimplenciaQuantidade} alunos` : "-"}
          hint={data ? formatCurrency(data.inadimplenciaValor) : undefined}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo mensal</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Relatórios completos poderão ser exportados para planilhas em breve.
        </CardContent>
      </Card>
    </div>
  )
}
