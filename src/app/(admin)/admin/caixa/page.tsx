"use client"

import { useEffect, useMemo, useState } from "react"
import { apiFetch } from "@/lib/client/api"
import { formatCurrency, formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type Lancamento = {
  id: string
  tipo: "ENTRADA" | "SAIDA"
  categoria: "FIXA" | "VARIAVEL"
  descricao: string
  valor: number
  data: string
  observacoes?: string | null
}

type Turma = {
  id: string
  nome: string
  planoFinanceiro: { valorMatricula: number } | null
  alunos: { inicioEm: string }[]
}

export default function AdminCaixaPage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [month, setMonth] = useState("")
  const [tipo, setTipo] = useState("")
  const [categoria, setCategoria] = useState("")
  const [open, setOpen] = useState(false)
  const [openEditar, setOpenEditar] = useState(false)
  const [editando, setEditando] = useState<Lancamento | null>(null)
  const [erro, setErro] = useState("")
  const [carregando, setCarregando] = useState(false)
  const [form, setForm] = useState({
    tipo: "ENTRADA",
    categoria: "FIXA",
    descricao: "",
    valor: "",
    data: "",
    observacoes: "",
  })
  const [formEdicao, setFormEdicao] = useState({
    tipo: "ENTRADA",
    categoria: "FIXA",
    descricao: "",
    valor: "",
    data: "",
    observacoes: "",
  })

  async function carregar() {
    setCarregando(true)
    setErro("")
    const query = new URLSearchParams()
    if (month) query.set("month", month)
    if (tipo) query.set("tipo", tipo)
    if (categoria) query.set("categoria", categoria)
    try {
      const [data, turmasData] = await Promise.all([
        apiFetch<Lancamento[]>(`/api/admin/financeiro/lancamentos?${query}`),
        apiFetch<Turma[]>("/api/admin/turmas"),
      ])
      setLancamentos(data)
      setTurmas(turmasData)
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao carregar lançamentos.")
      setLancamentos([])
      setTurmas([])
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [month, tipo, categoria])

  const totalMatriculas = useMemo(() => {
    if (turmas.length === 0) return 0
    const [yearStr, monthStr] = month.split("-")
    const year = Number(yearStr)
    const monthIndex = Number(monthStr)
    return turmas.reduce((acc, turma) => {
      const valorMatricula = turma.planoFinanceiro?.valorMatricula ?? 0
      if (!valorMatricula) return acc
      const matriculasNoPeriodo = turma.alunos.filter((alunoTurma) => {
        if (!month) return true
        if (!year || !monthIndex) return true
        const inicio = new Date(alunoTurma.inicioEm)
        return inicio.getFullYear() === year && inicio.getMonth() === monthIndex - 1
      }).length
      return acc + valorMatricula * matriculasNoPeriodo
    }, 0)
  }, [month, turmas])

  const totais = useMemo(() => {
    const totalEntradas = lancamentos
      .filter((item) => item.tipo === "ENTRADA")
      .reduce((acc, item) => acc + item.valor, 0)
    const totalSaidas = lancamentos
      .filter((item) => item.tipo === "SAIDA")
      .reduce((acc, item) => acc + item.valor, 0)
    const totalEntradasComMatriculas = totalEntradas + totalMatriculas
    return {
      totalEntradas,
      totalMatriculas,
      totalEntradasComMatriculas,
      totalSaidas,
      saldo: totalEntradasComMatriculas - totalSaidas,
    }
  }, [lancamentos, totalMatriculas])

  async function salvar() {
    if (!form.descricao || !form.valor || !form.data) {
      setErro("Preencha descrição, valor e data.")
      return
    }
    setErro("")
    try {
      await apiFetch("/api/admin/financeiro/lancamentos", {
        method: "POST",
        body: JSON.stringify({
          tipo: form.tipo,
          categoria: form.categoria,
          descricao: form.descricao,
          valor: Number(form.valor) * 100,
          data: form.data,
          observacoes: form.observacoes || undefined,
        }),
      })
      setOpen(false)
      setForm({
        tipo: "ENTRADA",
        categoria: "FIXA",
        descricao: "",
        valor: "",
        data: "",
        observacoes: "",
      })
      await carregar()
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao salvar lançamento.")
    }
  }

  function abrirEdicao(item: Lancamento) {
    setEditando(item)
    setFormEdicao({
      tipo: item.tipo,
      categoria: item.categoria,
      descricao: item.descricao,
      valor: String(item.valor / 100),
      data: item.data.slice(0, 10),
      observacoes: item.observacoes ?? "",
    })
    setOpenEditar(true)
  }

  async function salvarEdicao() {
    if (!editando) return
    if (!formEdicao.descricao || !formEdicao.valor || !formEdicao.data) {
      setErro("Preencha descrição, valor e data.")
      return
    }
    setErro("")
    try {
      await apiFetch(`/api/admin/financeiro/lancamentos/${editando.id}`, {
        method: "PUT",
        body: JSON.stringify({
          tipo: formEdicao.tipo,
          categoria: formEdicao.categoria,
          descricao: formEdicao.descricao,
          valor: Number(formEdicao.valor) * 100,
          data: formEdicao.data,
          observacoes: formEdicao.observacoes || undefined,
        }),
      })
      setOpenEditar(false)
      setEditando(null)
      await carregar()
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao salvar edição.")
    }
  }

  async function excluir(id: string) {
    const confirmar = window.confirm("Deseja excluir este lançamento?")
    if (!confirmar) return
    setErro("")
    try {
      await apiFetch(`/api/admin/financeiro/lancamentos/${id}`, { method: "DELETE" })
      await carregar()
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao excluir lançamento.")
    }
  }

  return (
    <div className="space-y-6">
      {erro ? (
        <Card className="border-danger">
          <CardContent className="py-3 text-sm text-danger-foreground bg-danger">{erro}</CardContent>
        </Card>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Entradas e saídas</h1>
          <p className="text-sm text-muted-foreground">
            Controle de despesas fixas/variáveis e receitas do cursinho.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Novo lançamento</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo lançamento</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(value) => setForm({ ...form, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTRADA">Entrada</SelectItem>
                    <SelectItem value="SAIDA">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select
                  value={form.categoria}
                  onValueChange={(value) => setForm({ ...form, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXA">Fixa</SelectItem>
                    <SelectItem value="VARIAVEL">Variável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Descrição</Label>
                <Input
                  value={form.descricao}
                  onChange={(event) => setForm({ ...form, descricao: event.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  value={form.valor}
                  onChange={(event) => setForm({ ...form, valor: event.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(event) => setForm({ ...form, data: event.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Observações</Label>
                <Input
                  value={form.observacoes}
                  onChange={(event) => setForm({ ...form, observacoes: event.target.value })}
                />
              </div>
              <Button onClick={salvar}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Entradas (com matrículas)</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold text-success-foreground">
            {formatCurrency(totais.totalEntradasComMatriculas)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Matrículas</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold text-success-foreground">
            {formatCurrency(totais.totalMatriculas)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Saídas</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold text-danger-foreground">
            {formatCurrency(totais.totalSaidas)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Saldo</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">{formatCurrency(totais.saldo)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label>Mês</Label>
            <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Tipo</Label>
            <Select value={tipo || "all"} onValueChange={(value) => setTipo(value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ENTRADA">Entrada</SelectItem>
                <SelectItem value="SAIDA">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Categoria</Label>
            <Select
              value={categoria || "all"}
              onValueChange={(value) => setCategoria(value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="FIXA">Fixa</SelectItem>
                <SelectItem value="VARIAVEL">Variável</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carregando ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-sm text-muted-foreground">
                    Carregando lançamentos...
                  </TableCell>
                </TableRow>
              ) : lancamentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-sm text-muted-foreground">
                    Nenhum lançamento encontrado para os filtros atuais.
                  </TableCell>
                </TableRow>
              ) : (
                lancamentos.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.data)}</TableCell>
                    <TableCell className="font-medium">{item.descricao}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          item.tipo === "ENTRADA"
                            ? "bg-success text-success-foreground"
                            : "bg-danger text-danger-foreground"
                        }
                      >
                        {item.tipo === "ENTRADA" ? "Entrada" : "Saída"}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.categoria === "FIXA" ? "Fixa" : "Variável"}</TableCell>
                    <TableCell>{formatCurrency(item.valor)}</TableCell>
                    <TableCell>{item.observacoes ?? "-"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => abrirEdicao(item)}>
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => excluir(item.id)}>
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={openEditar} onOpenChange={setOpenEditar}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar lançamento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select
                value={formEdicao.tipo}
                onValueChange={(value) => setFormEdicao({ ...formEdicao, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRADA">Entrada</SelectItem>
                  <SelectItem value="SAIDA">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select
                value={formEdicao.categoria}
                onValueChange={(value) => setFormEdicao({ ...formEdicao, categoria: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXA">Fixa</SelectItem>
                  <SelectItem value="VARIAVEL">Variável</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Input
                value={formEdicao.descricao}
                onChange={(event) => setFormEdicao({ ...formEdicao, descricao: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                value={formEdicao.valor}
                onChange={(event) => setFormEdicao({ ...formEdicao, valor: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={formEdicao.data}
                onChange={(event) => setFormEdicao({ ...formEdicao, data: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Observações</Label>
              <Input
                value={formEdicao.observacoes}
                onChange={(event) =>
                  setFormEdicao({ ...formEdicao, observacoes: event.target.value })
                }
              />
            </div>
            <Button onClick={salvarEdicao}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
