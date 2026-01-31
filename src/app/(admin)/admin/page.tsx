"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { apiFetch } from "@/lib/client/api"
import { formatCurrency, formatPercent } from "@/lib/format"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Relatorio = {
  totalAlunosAtivos: number
  totalTurmas: number
  presencaMediaMes: number
  totalRecebidoMes: number
  totalPendenteMes: number
  inadimplenciaQuantidade: number
  inadimplenciaValor: number
  totalPagamentosMes: number
  totalMensalidadesMes: number
  totalAulasMes: number
  totalBolsas: number
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<Relatorio | null>(null)

  useEffect(() => {
    apiFetch<Relatorio>("/api/admin/relatorios").then(setData).catch(() => setData(null))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral acadêmica e financeira do mês atual.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href="/admin/frequencia">Lançar frequência</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/financeiro">Registrar pagamento</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/alunos">Cadastrar aluno</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Alunos ativos" value={`${data?.totalAlunosAtivos ?? "-"}`} />
        <StatCard title="Turmas cadastradas" value={`${data?.totalTurmas ?? "-"}`} />
        <StatCard
          title="Presença média do mês"
          value={data ? formatPercent(data.presencaMediaMes) : "-"}
        />
        <StatCard
          title="Total recebido no mês"
          value={data ? formatCurrency(data.totalRecebidoMes) : "-"}
        />
        <StatCard
          title="Pagamentos no mês"
          value={`${data?.totalPagamentosMes ?? "-"}`}
        />
        <StatCard
          title="Mensalidades geradas"
          value={`${data?.totalMensalidadesMes ?? "-"}`}
        />
        <StatCard title="Aulas no período" value={`${data?.totalAulasMes ?? "-"}`} />
        <StatCard title="Bolsas/Descontos" value={`${data?.totalBolsas ?? "-"}`} />
        <StatCard
          title="Total pendente no mês"
          value={data ? formatCurrency(data.totalPendenteMes) : "-"}
        />
        <StatCard
          title="Inadimplência (qtd.)"
          value={`${data?.inadimplenciaQuantidade ?? "-"}`}
          hint="Mensalidades pendentes ou atrasadas."
        />
        <StatCard
          title="Inadimplência (valor)"
          value={data ? formatCurrency(data.inadimplenciaValor) : "-"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Avisos estratégicos</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Use os atalhos acima para atualizar presença e pagamentos. Os alertas de
          inadimplência e frequência baixa aparecem nos painéis dos alunos.
        </CardContent>
      </Card>
    </div>
  )
}
