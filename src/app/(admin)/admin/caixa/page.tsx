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

type CaixaSummary = {
  lancamentos: Lancamento[]
  totalMatriculas: number
}

export default function AdminCaixaPage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [totalMatriculas, setTotalMatriculas] = useState(0)
  const [month, setMonth] = useState("")
  const [tipo, setTipo] = useState("")
  const [categoria, setCategoria] = useState("")
  const [search, setSearch] = useState("")
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
      const queryString = query.toString()
      const data = await apiFetch<CaixaSummary>(
        queryString ? `/api/admin/financeiro/caixa?${queryString}` : "/api/admin/financeiro/caixa"
      )
      setLancamentos(data.lancamentos)
      setTotalMatriculas(data.totalMatriculas)
    } catch (error) {
      try {
        const queryString = query.toString()
        const fallback = await apiFetch<Lancamento[]>(
          queryString
            ? `/api/admin/financeiro/lancamentos?${queryString}`
            : "/api/admin/financeiro/lancamentos"
        )
        setLancamentos(fallback)
        setTotalMatriculas(0)
        setErro(
          "Não foi possível calcular matrículas agora. Lançamentos carregados normalmente."
        )
      } catch (fallbackError) {
        setErro(fallbackError instanceof Error ? fallbackError.message : "Erro ao carregar lançamentos.")
        setLancamentos([])
        setTotalMatriculas(0)
      }
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [month, tipo, categoria])

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

  const breakdown = useMemo(() => {
    const entradasFixas = lancamentos
      .filter((item) => item.tipo === "ENTRADA" && item.categoria === "FIXA")
      .reduce((acc, item) => acc + item.valor, 0)
    const entradasVariaveis = lancamentos
      .filter((item) => item.tipo === "ENTRADA" && item.categoria === "VARIAVEL")
      .reduce((acc, item) => acc + item.valor, 0)
    const saidasFixas = lancamentos
      .filter((item) => item.tipo === "SAIDA" && item.categoria === "FIXA")
      .reduce((acc, item) => acc + item.valor, 0)
    const saidasVariaveis = lancamentos
      .filter((item) => item.tipo === "SAIDA" && item.categoria === "VARIAVEL")
      .reduce((acc, item) => acc + item.valor, 0)
    return { entradasFixas, entradasVariaveis, saidasFixas, saidasVariaveis }
  }, [lancamentos])

  const lancamentosFiltrados = useMemo(() => {
    if (!search.trim()) return lancamentos
    const termo = search.trim().toLowerCase()
    return lancamentos.filter((item) => {
      const descricao = item.descricao.toLowerCase()
      const observacao = item.observacoes?.toLowerCase() ?? ""
      return descricao.includes(termo) || observacao.includes(termo)
    })
  }, [lancamentos, search])

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

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const previousMonth = `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}`

  function exportarCsv() {
    const header = [
      "Data",
      "Descricao",
      "Tipo",
      "Categoria",
      "Valor",
      "Observacoes",
    ]
    const linhas = lancamentosFiltrados.map((item) => [
      formatDate(item.data),
      item.descricao,
      item.tipo === "ENTRADA" ? "Entrada" : "Saida",
      item.categoria === "FIXA" ? "Fixa" : "Variavel",
      formatCurrency(item.valor),
      item.observacoes ?? "",
    ])
    const linhasTotais = [
      [],
      ["Entradas (com matriculas)", formatCurrency(totais.totalEntradasComMatriculas)],
      ["Matriculas", formatCurrency(totais.totalMatriculas)],
      ["Saidas", formatCurrency(totais.totalSaidas)],
      ["Saldo final", formatCurrency(totais.saldo)],
    ]
    const csv = [header, ...linhas, ...linhasTotais]
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? "")
            const escaped = value.replace(/"/g, '""')
            return `"${escaped}"`
          })
          .join(";")
      )
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `caixa-${month || "geral"}.csv`
    link.click()
    URL.revokeObjectURL(url)
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
          <h1 className="text-2xl font-semibold">Caixa do cursinho</h1>
          <p className="text-sm text-muted-foreground">
            Visão completa de entradas, saídas e matrículas no período selecionado.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={carregar}>
            Atualizar
          </Button>
          <Button variant="outline" onClick={() => setMonth(currentMonth)}>
            Mês atual
          </Button>
          <Button variant="outline" onClick={() => setMonth(previousMonth)}>
            Mês anterior
          </Button>
          <Button variant="ghost" onClick={() => setMonth("")}>
            Limpar mês
          </Button>
          <Button variant="outline" onClick={exportarCsv}>
            Exportar CSV
          </Button>
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
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entradas (com matrículas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-400">
              {formatCurrency(totais.totalEntradasComMatriculas)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Matrículas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">
              {formatCurrency(totais.totalMatriculas)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700 dark:text-red-400">
              {formatCurrency(totais.totalSaidas)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo final</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">
              {formatCurrency(totais.saldo)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-green-600 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Entradas fixas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(breakdown.entradasFixas)}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-600 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entradas variáveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(breakdown.entradasVariaveis)}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-600 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saídas fixas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(breakdown.saidasFixas)}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-600 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saídas variáveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(breakdown.saidasVariaveis)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros e busca</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
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
          <div className="grid gap-2">
            <Label>Buscar</Label>
            <Input
              placeholder="Descrição ou observação"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
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
              ) : lancamentosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-sm text-muted-foreground">
                    Nenhum lançamento encontrado para os filtros atuais.
                  </TableCell>
                </TableRow>
              ) : (
                lancamentosFiltrados.map((item) => (
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
