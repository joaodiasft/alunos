"use client"

import { useCallback, useEffect, useState } from "react"
import { apiFetch } from "@/lib/client/api"
import { formatCurrency, formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type Turma = { id: string; nome: string }
type Aluno = { id: string; nome: string }
type Mensalidade = {
  id: string
  referencia: string
  valorOriginal: number
  desconto: number
  valorFinal: number
  vencimento: string
  status: "PENDENTE" | "PAGO" | "ATRASADO" | "ISENTO"
  aprovacao: "PENDENTE" | "APROVADO" | "RECUSADO"
  aluno: { nome: string }
  turma: { nome: string }
}
type Bolsa = {
  id: string
  tipo: string
  percentual?: number | null
  valorFixo?: number | null
  aluno: { nome: string }
}

export default function AdminFinanceiroPage() {
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([])
  const [bolsas, setBolsas] = useState<Bolsa[]>([])
  const [filtroTurma, setFiltroTurma] = useState("")
  const [gerar, setGerar] = useState({
    turmaId: "",
    referencia: "",
    valorMensalidade: "",
  })
  const [pagamento, setPagamento] = useState({
    mensalidadeId: "",
    data: "",
    valorPago: "",
    forma: "PIX",
  })
  const [bolsaForm, setBolsaForm] = useState({
    alunoId: "",
    tipo: "",
    percentual: "",
    valorFixo: "",
  })

  const mensalidadesParaPagamento = mensalidades.filter(
    (item) => item.aprovacao !== "RECUSADO" && item.status !== "PAGO"
  )
  const mensalidadesPagas = mensalidades.filter((item) => item.status === "PAGO")
  const totalPago = mensalidadesPagas.reduce((acc, item) => acc + item.valorFinal, 0)

  const carregar = useCallback(async () => {
    try {
      const query = filtroTurma ? `?turmaId=${filtroTurma}` : ""
      const [turmasData, alunosData, mensalidadesData, bolsasData] = await Promise.all([
        apiFetch<Turma[]>("/api/admin/turmas"),
        apiFetch<Aluno[]>("/api/admin/alunos"),
        apiFetch<Mensalidade[]>(`/api/admin/financeiro/mensalidades${query}`),
        apiFetch<Bolsa[]>("/api/admin/financeiro/bolsas"),
      ])
      setTurmas(turmasData)
      setAlunos(alunosData)
      setMensalidades(mensalidadesData)
      setBolsas(bolsasData)
      if (!gerar.turmaId && turmasData.length > 0) {
        const agora = new Date()
        const referenciaAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`
        setGerar((prev) => ({
          ...prev,
          turmaId: turmasData[0].id,
          referencia: prev.referencia || referenciaAtual,
        }))
      }
    } catch {
      setTurmas([])
      setAlunos([])
      setMensalidades([])
      setBolsas([])
    }
  }, [filtroTurma])

  useEffect(() => {
    carregar()
  }, [filtroTurma])

  async function gerarMensalidades() {
    await apiFetch("/api/admin/financeiro/mensalidades", {
      method: "POST",
      body: JSON.stringify({
        turmaId: gerar.turmaId,
        referencia: gerar.referencia,
        valorMensalidade: gerar.valorMensalidade
          ? Number(gerar.valorMensalidade) * 100
          : undefined,
      }),
    })
    setGerar({ turmaId: "", referencia: "", valorMensalidade: "" })
    await carregar()
  }

  async function registrarPagamento() {
    await apiFetch("/api/admin/financeiro/pagamentos", {
      method: "POST",
      body: JSON.stringify({
        mensalidadeId: pagamento.mensalidadeId,
        data: pagamento.data,
        valorPago: Number(pagamento.valorPago) * 100,
        forma: pagamento.forma,
      }),
    })
    setPagamento({ mensalidadeId: "", data: "", valorPago: "", forma: "PIX" })
    await carregar()
  }

  async function atualizarAprovacao(mensalidadeId: string, aprovacao: "APROVADO" | "RECUSADO") {
    await apiFetch(`/api/admin/financeiro/mensalidades/${mensalidadeId}`, {
      method: "PATCH",
      body: JSON.stringify({ aprovacao }),
    })
    await carregar()
  }

  async function salvarBolsa() {
    await apiFetch("/api/admin/financeiro/bolsas", {
      method: "POST",
      body: JSON.stringify({
        alunoId: bolsaForm.alunoId,
        tipo: bolsaForm.tipo,
        percentual: bolsaForm.percentual ? Number(bolsaForm.percentual) : undefined,
        valorFixo: bolsaForm.valorFixo ? Number(bolsaForm.valorFixo) * 100 : undefined,
      }),
    })
    setBolsaForm({ alunoId: "", tipo: "", percentual: "", valorFixo: "" })
    await carregar()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Mensalidades, descontos e pagamentos.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gerar mensalidades</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label>Turma</Label>
              <Select
                value={gerar.turmaId}
                onValueChange={(value) => setGerar({ ...gerar, turmaId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Referência (YYYY-MM)</Label>
              <Input
                value={gerar.referencia}
                onChange={(event) => setGerar({ ...gerar, referencia: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Valor mensalidade (R$ opcional)</Label>
              <Input
                type="number"
                value={gerar.valorMensalidade}
                onChange={(event) =>
                  setGerar({ ...gerar, valorMensalidade: event.target.value })
                }
              />
            </div>
            <Button onClick={gerarMensalidades}>Gerar</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registrar pagamento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label>Mensalidade</Label>
              <Select
                value={pagamento.mensalidadeId}
                onValueChange={(value) => setPagamento({ ...pagamento, mensalidadeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {mensalidadesParaPagamento.map((mensalidade) => (
                    <SelectItem key={mensalidade.id} value={mensalidade.id}>
                      {mensalidade.aluno.nome} - {mensalidade.referencia} ({mensalidade.turma.nome})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mensalidadesParaPagamento.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  Nenhuma mensalidade pendente. Gere as mensalidades do mês primeiro.
                </div>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label>Data do pagamento</Label>
              <Input
                type="date"
                value={pagamento.data}
                onChange={(event) => setPagamento({ ...pagamento, data: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Valor pago (R$)</Label>
              <Input
                type="number"
                value={pagamento.valorPago}
                onChange={(event) => setPagamento({ ...pagamento, valorPago: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Forma</Label>
              <Select
                value={pagamento.forma}
                onValueChange={(value) => setPagamento({ ...pagamento, forma: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">Pix</SelectItem>
                  <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                  <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                  <SelectItem value="CARTAO">Cartão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={registrarPagamento}>Registrar</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bolsas e descontos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label>Aluno</Label>
              <Select
                value={bolsaForm.alunoId}
                onValueChange={(value) => setBolsaForm({ ...bolsaForm, alunoId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {alunos.map((aluno) => (
                    <SelectItem key={aluno.id} value={aluno.id}>
                      {aluno.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Input
                value={bolsaForm.tipo}
                onChange={(event) => setBolsaForm({ ...bolsaForm, tipo: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Percentual (opcional)</Label>
              <Input
                type="number"
                value={bolsaForm.percentual}
                onChange={(event) =>
                  setBolsaForm({ ...bolsaForm, percentual: event.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Valor fixo (R$ opcional)</Label>
              <Input
                type="number"
                value={bolsaForm.valorFixo}
                onChange={(event) => setBolsaForm({ ...bolsaForm, valorFixo: event.target.value })}
              />
            </div>
            <Button onClick={salvarBolsa}>Salvar desconto</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Descontos cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Percentual</TableHead>
                  <TableHead>Valor fixo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bolsas.map((bolsa) => (
                  <TableRow key={bolsa.id}>
                    <TableCell className="font-medium">{bolsa.aluno.nome}</TableCell>
                    <TableCell>{bolsa.tipo}</TableCell>
                    <TableCell>{bolsa.percentual ? `${bolsa.percentual}%` : "-"}</TableCell>
                    <TableCell>
                      {bolsa.valorFixo ? formatCurrency(bolsa.valorFixo) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contas a receber</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-2 md:max-w-xs">
            <Label>Filtrar por turma</Label>
            <Select value={filtroTurma || "all"} onValueChange={(value) => setFiltroTurma(value === "all" ? "" : value)}>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor final</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aprovação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mensalidades.map((mensalidade) => (
                <TableRow key={mensalidade.id}>
                  <TableCell className="font-medium">{mensalidade.aluno.nome}</TableCell>
                  <TableCell>{mensalidade.turma.nome}</TableCell>
                  <TableCell>{mensalidade.referencia}</TableCell>
                  <TableCell>{formatDate(mensalidade.vencimento)}</TableCell>
                  <TableCell>{formatCurrency(mensalidade.valorFinal)}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        mensalidade.aprovacao === "RECUSADO"
                          ? "bg-danger text-danger-foreground"
                          : mensalidade.status === "PAGO"
                            ? "bg-success text-success-foreground"
                            : "bg-warning text-warning-foreground"
                      }
                    >
                      {mensalidade.aprovacao === "RECUSADO"
                        ? "Recusado"
                        : mensalidade.status === "PAGO"
                          ? "Pago"
                          : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        mensalidade.aprovacao === "APROVADO"
                          ? "border-success text-success"
                          : mensalidade.aprovacao === "RECUSADO"
                            ? "border-danger text-danger"
                            : "border-warning text-warning"
                      }
                    >
                      {mensalidade.aprovacao === "PENDENTE"
                        ? "Aguardando"
                        : mensalidade.aprovacao === "APROVADO"
                          ? "Aprovado"
                          : "Recusado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => atualizarAprovacao(mensalidade.id, "APROVADO")}
                      >
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => atualizarAprovacao(mensalidade.id, "RECUSADO")}
                      >
                        Recusar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagamentos confirmados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">{mensalidadesPagas.length}</span>{" "}
              pagamentos confirmados
            </div>
            <div>
              Total recebido:{" "}
              <span className="font-medium text-foreground">{formatCurrency(totalPago)}</span>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor final</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mensalidadesPagas.map((mensalidade) => (
                <TableRow key={mensalidade.id}>
                  <TableCell className="font-medium">{mensalidade.aluno.nome}</TableCell>
                  <TableCell>{mensalidade.turma.nome}</TableCell>
                  <TableCell>{mensalidade.referencia}</TableCell>
                  <TableCell>{formatDate(mensalidade.vencimento)}</TableCell>
                  <TableCell>{formatCurrency(mensalidade.valorFinal)}</TableCell>
                  <TableCell>
                    <Badge className="bg-success text-success-foreground">Pago</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
