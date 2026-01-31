"use client"

import { useEffect, useMemo, useState } from "react"
import { apiFetch } from "@/lib/client/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Turma = { id: string; nome: string }
type Aluno = { id: string; nome: string; turmas: { turma: { id: string; nome: string } }[] }
type Redacao = {
  id: string
  referencia: string
  competencia1: number
  competencia2: number
  competencia3: number
  competencia4: number
  competencia5: number
  total: number
  observacoes?: string | null
  aluno: { id: string; nome: string }
  turma?: { id: string; nome: string } | null
}

export default function AdminRedacoesPage() {
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [redacoes, setRedacoes] = useState<Redacao[]>([])
  const [filtroAluno, setFiltroAluno] = useState("")
  const [filtroTurma, setFiltroTurma] = useState("")
  const [filtroReferencia, setFiltroReferencia] = useState("")
  const [open, setOpen] = useState(false)
  const [openEditar, setOpenEditar] = useState(false)
  const [editando, setEditando] = useState<Redacao | null>(null)
  const [erro, setErro] = useState("")
  const [form, setForm] = useState({
    alunoId: "",
    turmaId: "",
    referencia: "",
    competencia1: "",
    competencia2: "",
    competencia3: "",
    competencia4: "",
    competencia5: "",
    observacoes: "",
  })
  const [formEdicao, setFormEdicao] = useState({
    turmaId: "",
    referencia: "",
    competencia1: "",
    competencia2: "",
    competencia3: "",
    competencia4: "",
    competencia5: "",
    observacoes: "",
  })

  const totalForm = useMemo(() => {
    return (
      Number(form.competencia1 || 0) +
      Number(form.competencia2 || 0) +
      Number(form.competencia3 || 0) +
      Number(form.competencia4 || 0) +
      Number(form.competencia5 || 0)
    )
  }, [form])

  const totalEdicao = useMemo(() => {
    return (
      Number(formEdicao.competencia1 || 0) +
      Number(formEdicao.competencia2 || 0) +
      Number(formEdicao.competencia3 || 0) +
      Number(formEdicao.competencia4 || 0) +
      Number(formEdicao.competencia5 || 0)
    )
  }, [formEdicao])

  async function carregar() {
    const query = new URLSearchParams()
    if (filtroAluno) query.set("alunoId", filtroAluno)
    if (filtroTurma) query.set("turmaId", filtroTurma)
    if (filtroReferencia) query.set("referencia", filtroReferencia)
    const [turmasData, alunosData, redacoesData] = await Promise.all([
      apiFetch<Turma[]>("/api/admin/turmas"),
      apiFetch<Aluno[]>("/api/admin/alunos"),
      apiFetch<Redacao[]>(`/api/admin/redacoes?${query.toString()}`),
    ])
    setTurmas(turmasData)
    setAlunos(alunosData)
    setRedacoes(redacoesData)
    if (!form.referencia) {
      const hoje = new Date()
      const ref = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`
      setForm((prev) => ({ ...prev, referencia: ref }))
    }
  }

  useEffect(() => {
    carregar()
  }, [filtroAluno, filtroTurma, filtroReferencia])

  const turmasDoAluno = useMemo(() => {
    const aluno = alunos.find((item) => item.id === form.alunoId)
    return aluno?.turmas.map((item) => item.turma) ?? turmas
  }, [alunos, form.alunoId, turmas])

  const turmasDoAlunoEdicao = useMemo(() => {
    if (!editando) return turmas
    const aluno = alunos.find((item) => item.id === editando.aluno.id)
    return aluno?.turmas.map((item) => item.turma) ?? turmas
  }, [alunos, editando, turmas])

  async function salvar() {
    if (!form.alunoId || !form.referencia) {
      setErro("Selecione o aluno e informe a referência.")
      return
    }
    setErro("")
    await apiFetch("/api/admin/redacoes", {
      method: "POST",
      body: JSON.stringify({
        alunoId: form.alunoId,
        turmaId: form.turmaId || undefined,
        referencia: form.referencia,
        competencia1: Number(form.competencia1 || 0),
        competencia2: Number(form.competencia2 || 0),
        competencia3: Number(form.competencia3 || 0),
        competencia4: Number(form.competencia4 || 0),
        competencia5: Number(form.competencia5 || 0),
        observacoes: form.observacoes || undefined,
      }),
    })
    setOpen(false)
    setForm({
      alunoId: "",
      turmaId: "",
      referencia: form.referencia,
      competencia1: "",
      competencia2: "",
      competencia3: "",
      competencia4: "",
      competencia5: "",
      observacoes: "",
    })
    await carregar()
  }

  function abrirEdicao(item: Redacao) {
    setEditando(item)
    setFormEdicao({
      turmaId: item.turma?.id ?? "",
      referencia: item.referencia,
      competencia1: String(item.competencia1),
      competencia2: String(item.competencia2),
      competencia3: String(item.competencia3),
      competencia4: String(item.competencia4),
      competencia5: String(item.competencia5),
      observacoes: item.observacoes ?? "",
    })
    setOpenEditar(true)
  }

  async function salvarEdicao() {
    if (!editando) return
    if (!formEdicao.referencia) {
      setErro("Informe a referência.")
      return
    }
    setErro("")
    await apiFetch(`/api/admin/redacoes/${editando.id}`, {
      method: "PUT",
      body: JSON.stringify({
        turmaId: formEdicao.turmaId || undefined,
        referencia: formEdicao.referencia,
        competencia1: Number(formEdicao.competencia1 || 0),
        competencia2: Number(formEdicao.competencia2 || 0),
        competencia3: Number(formEdicao.competencia3 || 0),
        competencia4: Number(formEdicao.competencia4 || 0),
        competencia5: Number(formEdicao.competencia5 || 0),
        observacoes: formEdicao.observacoes || undefined,
      }),
    })
    setOpenEditar(false)
    setEditando(null)
    await carregar()
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
          <h1 className="text-2xl font-semibold">Notas de redação</h1>
          <p className="text-sm text-muted-foreground">
            Lançamento por competência e acompanhamento do aluno.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Lançar nota</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova nota de redação</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Aluno</Label>
                <Select
                  value={form.alunoId}
                  onValueChange={(value) => setForm({ ...form, alunoId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o aluno" />
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
                <Label>Turma (opcional)</Label>
                <Select
                  value={form.turmaId || "none"}
                  onValueChange={(value) =>
                    setForm({ ...form, turmaId: value === "none" ? "" : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem turma</SelectItem>
                    {turmasDoAluno.map((turma) => (
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
                  value={form.referencia}
                  onChange={(event) => setForm({ ...form, referencia: event.target.value })}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Competência 1</Label>
                  <Input
                    type="number"
                    value={form.competencia1}
                    onChange={(event) => setForm({ ...form, competencia1: event.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Competência 2</Label>
                  <Input
                    type="number"
                    value={form.competencia2}
                    onChange={(event) => setForm({ ...form, competencia2: event.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Competência 3</Label>
                  <Input
                    type="number"
                    value={form.competencia3}
                    onChange={(event) => setForm({ ...form, competencia3: event.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Competência 4</Label>
                  <Input
                    type="number"
                    value={form.competencia4}
                    onChange={(event) => setForm({ ...form, competencia4: event.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Competência 5</Label>
                  <Input
                    type="number"
                    value={form.competencia5}
                    onChange={(event) => setForm({ ...form, competencia5: event.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Total</Label>
                  <Input value={String(totalForm)} readOnly />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Observações</Label>
                <Input
                  value={form.observacoes}
                  onChange={(event) => setForm({ ...form, observacoes: event.target.value })}
                />
              </div>
              <Button onClick={salvar} disabled={!form.alunoId || !form.referencia}>
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label>Aluno</Label>
            <Select
              value={filtroAluno || "all"}
              onValueChange={(value) => setFiltroAluno(value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {alunos.map((aluno) => (
                  <SelectItem key={aluno.id} value={aluno.id}>
                    {aluno.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Turma</Label>
            <Select
              value={filtroTurma || "all"}
              onValueChange={(value) => setFiltroTurma(value === "all" ? "" : value)}
            >
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
          <div className="grid gap-2">
            <Label>Referência</Label>
            <Input
              placeholder="YYYY-MM"
              value={filtroReferencia}
              onChange={(event) => setFiltroReferencia(event.target.value)}
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
                <TableHead>Aluno</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>C1</TableHead>
                <TableHead>C2</TableHead>
                <TableHead>C3</TableHead>
                <TableHead>C4</TableHead>
                <TableHead>C5</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {redacoes.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.aluno.nome}</TableCell>
                  <TableCell>{item.turma?.nome ?? "-"}</TableCell>
                  <TableCell>{item.referencia}</TableCell>
                  <TableCell>{item.competencia1}</TableCell>
                  <TableCell>{item.competencia2}</TableCell>
                  <TableCell>{item.competencia3}</TableCell>
                  <TableCell>{item.competencia4}</TableCell>
                  <TableCell>{item.competencia5}</TableCell>
                  <TableCell>{item.total}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => abrirEdicao(item)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={openEditar} onOpenChange={setOpenEditar}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar nota de redação</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Turma (opcional)</Label>
              <Select
                value={formEdicao.turmaId || "none"}
                onValueChange={(value) =>
                  setFormEdicao({ ...formEdicao, turmaId: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem turma</SelectItem>
                  {turmasDoAlunoEdicao.map((turma) => (
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
                value={formEdicao.referencia}
                onChange={(event) => setFormEdicao({ ...formEdicao, referencia: event.target.value })}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="grid gap-2">
                <Label>Competência 1</Label>
                <Input
                  type="number"
                  value={formEdicao.competencia1}
                  onChange={(event) =>
                    setFormEdicao({ ...formEdicao, competencia1: event.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Competência 2</Label>
                <Input
                  type="number"
                  value={formEdicao.competencia2}
                  onChange={(event) =>
                    setFormEdicao({ ...formEdicao, competencia2: event.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Competência 3</Label>
                <Input
                  type="number"
                  value={formEdicao.competencia3}
                  onChange={(event) =>
                    setFormEdicao({ ...formEdicao, competencia3: event.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Competência 4</Label>
                <Input
                  type="number"
                  value={formEdicao.competencia4}
                  onChange={(event) =>
                    setFormEdicao({ ...formEdicao, competencia4: event.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Competência 5</Label>
                <Input
                  type="number"
                  value={formEdicao.competencia5}
                  onChange={(event) =>
                    setFormEdicao({ ...formEdicao, competencia5: event.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Total</Label>
                <Input value={String(totalEdicao)} readOnly />
              </div>
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
