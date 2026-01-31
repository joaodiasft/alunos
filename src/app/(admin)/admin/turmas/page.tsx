"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/client/api"
import { formatCurrency } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Turma = {
  id: string
  nome: string
  anoLetivo: number
  turno: "MANHA" | "TARDE" | "NOITE"
  modalidade: "PRESENCIAL" | "ONLINE"
  planoFinanceiro?: { valorMatricula: number; valorMensalidade: number }
  alunos: { aluno: { nome: string } }[]
}

export default function AdminTurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [open, setOpen] = useState(false)
  const [openEditar, setOpenEditar] = useState(false)
  const [turmaEditando, setTurmaEditando] = useState<Turma | null>(null)
  const [erro, setErro] = useState("")
  const [form, setForm] = useState({
    nome: "",
    anoLetivo: new Date().getFullYear().toString(),
    turno: "MANHA",
    modalidade: "PRESENCIAL",
    valorMatricula: "",
    valorMensalidade: "",
  })
  const [formEdicao, setFormEdicao] = useState({
    nome: "",
    anoLetivo: new Date().getFullYear().toString(),
    turno: "MANHA",
    modalidade: "PRESENCIAL",
    valorMatricula: "",
    valorMensalidade: "",
  })

  async function carregarDados() {
    try {
      const data = await apiFetch<Turma[]>("/api/admin/turmas")
      setTurmas(data)
    } catch {
      setTurmas([])
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  async function criarTurma() {
    setErro("")
    const anoLetivo = Number(form.anoLetivo)
    if (!form.nome || Number.isNaN(anoLetivo)) {
      setErro("Preencha nome e ano letivo válidos.")
      return
    }
    await apiFetch("/api/admin/turmas", {
      method: "POST",
      body: JSON.stringify({
        nome: form.nome,
        anoLetivo,
        turno: form.turno,
        modalidade: form.modalidade,
        valorMatricula: form.valorMatricula ? Number(form.valorMatricula) * 100 : undefined,
        valorMensalidade: form.valorMensalidade ? Number(form.valorMensalidade) * 100 : undefined,
      }),
    })
    setOpen(false)
    setForm({
      nome: "",
      anoLetivo: new Date().getFullYear().toString(),
      turno: "MANHA",
      modalidade: "PRESENCIAL",
      valorMatricula: "",
      valorMensalidade: "",
    })
    await carregarDados()
  }

  function abrirEdicao(turma: Turma) {
    setTurmaEditando(turma)
    setFormEdicao({
      nome: turma.nome,
      anoLetivo: String(turma.anoLetivo),
      turno: turma.turno,
      modalidade: turma.modalidade,
      valorMatricula: turma.planoFinanceiro
        ? String(turma.planoFinanceiro.valorMatricula / 100)
        : "",
      valorMensalidade: turma.planoFinanceiro
        ? String(turma.planoFinanceiro.valorMensalidade / 100)
        : "",
    })
    setOpenEditar(true)
  }

  async function salvarEdicao() {
    if (!turmaEditando) return
    setErro("")
    const anoLetivo = Number(formEdicao.anoLetivo)
    if (!formEdicao.nome || Number.isNaN(anoLetivo)) {
      setErro("Preencha nome e ano letivo válidos.")
      return
    }
    await apiFetch(`/api/admin/turmas/${turmaEditando.id}`, {
      method: "PUT",
      body: JSON.stringify({
        nome: formEdicao.nome,
        anoLetivo,
        turno: formEdicao.turno,
        modalidade: formEdicao.modalidade,
        valorMatricula: formEdicao.valorMatricula
          ? Number(formEdicao.valorMatricula) * 100
          : undefined,
        valorMensalidade: formEdicao.valorMensalidade
          ? Number(formEdicao.valorMensalidade) * 100
          : undefined,
      }),
    })
    setOpenEditar(false)
    setTurmaEditando(null)
    await carregarDados()
  }

  return (
    <div className="space-y-6">
      {erro ? (
        <Card className="border-danger">
          <CardContent className="py-3 text-sm text-danger-foreground bg-danger">
            {erro}
          </CardContent>
        </Card>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Turmas</h1>
          <p className="text-sm text-muted-foreground">Organize séries e turnos.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Nova turma</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastro de turma</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Nome</Label>
                <Input
                  value={form.nome}
                  onChange={(event) => setForm({ ...form, nome: event.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Ano letivo</Label>
                <Input
                  value={form.anoLetivo}
                  onChange={(event) => setForm({ ...form, anoLetivo: event.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Turno</Label>
                <Select
                  value={form.turno}
                  onValueChange={(value) => setForm({ ...form, turno: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANHA">Manhã</SelectItem>
                    <SelectItem value="TARDE">Tarde</SelectItem>
                    <SelectItem value="NOITE">Noite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Modalidade</Label>
                <Select
                  value={form.modalidade}
                  onValueChange={(value) => setForm({ ...form, modalidade: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                    <SelectItem value="ONLINE">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Valor matrícula (R$)</Label>
                <Input
                  type="number"
                  value={form.valorMatricula}
                  onChange={(event) => setForm({ ...form, valorMatricula: event.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Valor mensalidade (R$)</Label>
                <Input
                  type="number"
                  value={form.valorMensalidade}
                  onChange={(event) => setForm({ ...form, valorMensalidade: event.target.value })}
                />
              </div>
              <Button onClick={criarTurma}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={openEditar} onOpenChange={setOpenEditar}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar turma</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Nome</Label>
                <Input
                  value={formEdicao.nome}
                  onChange={(event) => setFormEdicao({ ...formEdicao, nome: event.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Ano letivo</Label>
                <Input
                  value={formEdicao.anoLetivo}
                  onChange={(event) =>
                    setFormEdicao({ ...formEdicao, anoLetivo: event.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Turno</Label>
                <Select
                  value={formEdicao.turno}
                  onValueChange={(value) => setFormEdicao({ ...formEdicao, turno: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANHA">Manhã</SelectItem>
                    <SelectItem value="TARDE">Tarde</SelectItem>
                    <SelectItem value="NOITE">Noite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Modalidade</Label>
                <Select
                  value={formEdicao.modalidade}
                  onValueChange={(value) => setFormEdicao({ ...formEdicao, modalidade: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                    <SelectItem value="ONLINE">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Valor matrícula (R$)</Label>
                <Input
                  type="number"
                  value={formEdicao.valorMatricula}
                  onChange={(event) =>
                    setFormEdicao({ ...formEdicao, valorMatricula: event.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Valor mensalidade (R$)</Label>
                <Input
                  type="number"
                  value={formEdicao.valorMensalidade}
                  onChange={(event) =>
                    setFormEdicao({ ...formEdicao, valorMensalidade: event.target.value })
                  }
                />
              </div>
              <Button onClick={salvarEdicao}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Turmas cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Modalidade</TableHead>
                <TableHead>Mensalidade</TableHead>
                <TableHead>Alunos ativos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {turmas.map((turma) => (
                <TableRow key={turma.id}>
                  <TableCell className="font-medium">{turma.nome}</TableCell>
                  <TableCell>{turma.anoLetivo}</TableCell>
                  <TableCell>{turma.turno}</TableCell>
                  <TableCell>{turma.modalidade}</TableCell>
                  <TableCell>
                    {turma.planoFinanceiro
                      ? formatCurrency(turma.planoFinanceiro.valorMensalidade)
                      : "-"}
                  </TableCell>
                  <TableCell>{turma.alunos.length}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => abrirEdicao(turma)}>
                      Editar
                    </Button>
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
