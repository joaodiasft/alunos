"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/client/api"
import { formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

type Turma = {
  id: string
  nome: string
}

type Aluno = {
  id: string
  nome: string
  dataNascimento: string
  telefone: string
  token: string
  status: "ATIVO" | "INATIVO"
  turmas: { turma: { id: string; nome: string } }[]
}

export default function AdminAlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [open, setOpen] = useState(false)
  const [openEditar, setOpenEditar] = useState(false)
  const [alunoEditando, setAlunoEditando] = useState<Aluno | null>(null)
  const [form, setForm] = useState({
    nome: "",
    dataNascimento: "",
    telefone: "",
    turmaIds: [] as string[],
    responsavelNome: "",
    responsavelTelefone: "",
  })
  const [formEdicao, setFormEdicao] = useState({
    nome: "",
    dataNascimento: "",
    telefone: "",
    turmaIds: [] as string[],
    status: "ATIVO" as "ATIVO" | "INATIVO",
  })

  async function carregarDados() {
    try {
      const [alunosData, turmasData] = await Promise.all([
        apiFetch<Aluno[]>("/api/admin/alunos"),
        apiFetch<Turma[]>("/api/admin/turmas"),
      ])
      setAlunos(alunosData)
      setTurmas(turmasData)
    } catch {
      setAlunos([])
      setTurmas([])
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  async function criarAluno() {
    await apiFetch("/api/admin/alunos", {
      method: "POST",
      body: JSON.stringify(form),
    })
    setOpen(false)
    setForm({
      nome: "",
      dataNascimento: "",
      telefone: "",
      turmaIds: [],
      responsavelNome: "",
      responsavelTelefone: "",
    })
    await carregarDados()
  }

  async function inativarAluno(id: string) {
    await apiFetch(`/api/admin/alunos/${id}`, { method: "DELETE" })
    await carregarDados()
  }

  function abrirEdicao(aluno: Aluno) {
    setAlunoEditando(aluno)
    setFormEdicao({
      nome: aluno.nome,
      dataNascimento: aluno.dataNascimento.slice(0, 10),
      telefone: aluno.telefone,
      turmaIds: aluno.turmas.map((item) => item.turma.id),
      status: aluno.status,
    })
    setOpenEditar(true)
  }

  async function salvarEdicao() {
    if (!alunoEditando) return
    await apiFetch(`/api/admin/alunos/${alunoEditando.id}`, {
      method: "PUT",
      body: JSON.stringify({
        nome: formEdicao.nome,
        dataNascimento: formEdicao.dataNascimento,
        telefone: formEdicao.telefone,
        status: formEdicao.status,
        turmaIds: formEdicao.turmaIds,
      }),
    })
    setOpenEditar(false)
    setAlunoEditando(null)
    await carregarDados()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Alunos</h1>
          <p className="text-sm text-muted-foreground">Cadastro e vínculos com turmas.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Cadastrar aluno</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo aluno</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Nome completo</Label>
                <Input
                  value={form.nome}
                  onChange={(event) => setForm({ ...form, nome: event.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Data de nascimento</Label>
                <Input
                  type="date"
                  value={form.dataNascimento}
                  onChange={(event) => setForm({ ...form, dataNascimento: event.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Telefone do aluno</Label>
                <Input
                  value={form.telefone}
                  onChange={(event) => setForm({ ...form, telefone: event.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Turmas</Label>
                <div className="grid gap-2 rounded-md border border-border p-3">
                  {turmas.map((turma) => {
                    const checked = form.turmaIds.includes(turma.id)
                    return (
                      <label key={turma.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => {
                            const isChecked = Boolean(value)
                            setForm((prev) => ({
                              ...prev,
                              turmaIds: isChecked
                                ? [...prev.turmaIds, turma.id]
                                : prev.turmaIds.filter((id) => id !== turma.id),
                            }))
                          }}
                        />
                        {turma.nome}
                      </label>
                    )
                  })}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Responsável (opcional)</Label>
                <Input
                  placeholder="Nome do responsável"
                  value={form.responsavelNome}
                  onChange={(event) =>
                    setForm({ ...form, responsavelNome: event.target.value })
                  }
                />
                <Input
                  placeholder="Telefone do responsável"
                  value={form.responsavelTelefone}
                  onChange={(event) =>
                    setForm({ ...form, responsavelTelefone: event.target.value })
                  }
                />
              </div>
              <Button onClick={criarAluno}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={openEditar} onOpenChange={setOpenEditar}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar aluno</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Nome completo</Label>
                <Input
                  value={formEdicao.nome}
                  onChange={(event) => setFormEdicao({ ...formEdicao, nome: event.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Data de nascimento</Label>
                <Input
                  type="date"
                  value={formEdicao.dataNascimento}
                  onChange={(event) =>
                    setFormEdicao({ ...formEdicao, dataNascimento: event.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Telefone do aluno</Label>
                <Input
                  value={formEdicao.telefone}
                  onChange={(event) =>
                    setFormEdicao({ ...formEdicao, telefone: event.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={formEdicao.status}
                  onValueChange={(value) =>
                    setFormEdicao({ ...formEdicao, status: value as "ATIVO" | "INATIVO" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="INATIVO">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Turmas</Label>
                <div className="grid gap-2 rounded-md border border-border p-3">
                  {turmas.map((turma) => {
                    const checked = formEdicao.turmaIds.includes(turma.id)
                    return (
                      <label key={turma.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => {
                            const isChecked = Boolean(value)
                            setFormEdicao((prev) => ({
                              ...prev,
                              turmaIds: isChecked
                                ? [...prev.turmaIds, turma.id]
                                : prev.turmaIds.filter((id) => id !== turma.id),
                            }))
                          }}
                        />
                        {turma.nome}
                      </label>
                    )
                  })}
                </div>
              </div>
              <Button onClick={salvarEdicao}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de alunos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Nascimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alunos.map((aluno) => (
                <TableRow key={aluno.id}>
                  <TableCell className="font-medium">{aluno.nome}</TableCell>
                  <TableCell>{aluno.token}</TableCell>
                  <TableCell>
                    {aluno.turmas.length
                      ? aluno.turmas.map((item) => item.turma.nome).join(", ")
                      : "-"}
                  </TableCell>
                  <TableCell>{formatDate(aluno.dataNascimento)}</TableCell>
                  <TableCell>
                    <Badge variant={aluno.status === "ATIVO" ? "secondary" : "outline"}>
                      {aluno.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => abrirEdicao(aluno)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => inativarAluno(aluno.id)}
                      >
                        Inativar
                      </Button>
                    </div>
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
