"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/client/api"
import { formatCurrency, formatPercent } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/dashboard/stat-card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

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
  const [period, setPeriod] = useState<"month" | "week">("month")
  const [month, setMonth] = useState("")
  const [week, setWeek] = useState("")
  const [turmaId, setTurmaId] = useState("")
  const [turmas, setTurmas] = useState<{ id: string; nome: string }[]>([])

  useEffect(() => {
    apiFetch<{ id: string; nome: string }[]>("/api/admin/turmas")
      .then(setTurmas)
      .catch(() => setTurmas([]))
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    params.set("period", period)
    if (period === "month" && month) params.set("month", month)
    if (period === "week" && week) params.set("week", week)
    if (turmaId) params.set("turmaId", turmaId)
    const query = params.toString()
    apiFetch<Relatorio>(`/api/admin/relatorios?${query}`).then(setData).catch(() => setData(null))
  }, [period, month, week, turmaId])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">
          Indicadores acadêmicos e financeiros do período atual.
        </p>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => window.print()}>
          Exportar PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label>Período</Label>
            <Select value={period} onValueChange={(value) => setPeriod(value as "month" | "week")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mensal</SelectItem>
                <SelectItem value="week">Semanal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {period === "month" ? (
            <div className="grid gap-2">
              <Label>Mês</Label>
              <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
          ) : (
            <div className="grid gap-2">
              <Label>Semana</Label>
              <Input type="week" value={week} onChange={(e) => setWeek(e.target.value)} />
            </div>
          )}
          <div className="grid gap-2">
            <Label>Turma</Label>
            <Select value={turmaId || "all"} onValueChange={(value) => setTurmaId(value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {turmas.map((turma) => (
                  <SelectItem key={turma.id} value={turma.id}>
                    {turma.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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
          <CardTitle>Resumo do período</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Relatórios completos poderão ser exportados para planilhas em breve.
        </CardContent>
      </Card>
    </div>
  )
}
