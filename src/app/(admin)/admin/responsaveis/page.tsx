"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/client/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Aluno = { id: string; nome: string }
type Responsavel = {
  id: string
  nome: string
  telefone: string
  alunos: { aluno: { nome: string } }[]
}

export default function AdminResponsaveisPage() {
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [open, setOpen] = useState(false)
  const [openEditar, setOpenEditar] = useState(false)
  const [responsavelEditando, setResponsavelEditando] = useState<Responsavel | null>(null)
  const [form, setForm] = useState({ nome: "", telefone: "", alunoId: "" })
  const [formEdicao, setFormEdicao] = useState({ nome: "", telefone: "", alunoId: "" })

  async function carregar() {
    try {
      const [responsaveisData, alunosData] = await Promise.all([
        apiFetch<Responsavel[]>("/api/admin/responsaveis"),
        apiFetch<Aluno[]>("/api/admin/alunos"),
      ])
      setResponsaveis(responsaveisData)
      setAlunos(alunosData)
    } catch {
      setResponsaveis([])
      setAlunos([])
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  async function salvar() {
    await apiFetch("/api/admin/responsaveis", {
      method: "POST",
      body: JSON.stringify(form),
    })
    setOpen(false)
    setForm({ nome: "", telefone: "", alunoId: "" })
    await carregar()
  }

  function abrirEdicao(responsavel: Responsavel) {
    setResponsavelEditando(responsavel)
    setFormEdicao({
      nome: responsavel.nome,
      telefone: responsavel.telefone,
      alunoId: "",
    })
    setOpenEditar(true)
  }

  async function salvarEdicao() {
    if (!responsavelEditando) return
    await apiFetch(`/api/admin/responsaveis/${responsavelEditando.id}`, {
      method: "PUT",
      body: JSON.stringify(formEdicao),
    })
    setOpenEditar(false)
    setResponsavelEditando(null)
    await carregar()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Responsáveis</h1>
          <p className="text-sm text-muted-foreground">Cadastro e vínculo com alunos.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Novo responsável</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastro de responsável</DialogTitle>
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
                <Label>Telefone</Label>
                <Input
                  value={form.telefone}
                  onChange={(event) => setForm({ ...form, telefone: event.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Aluno vinculado (opcional)</Label>
                <Select
                  value={form.alunoId}
                  onValueChange={(value) => setForm({ ...form, alunoId: value })}
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
              <Button onClick={salvar}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={openEditar} onOpenChange={setOpenEditar}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar responsável</DialogTitle>
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
                <Label>Telefone</Label>
                <Input
                  value={formEdicao.telefone}
                  onChange={(event) =>
                    setFormEdicao({ ...formEdicao, telefone: event.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Vincular aluno (opcional)</Label>
                <Select
                  value={formEdicao.alunoId}
                  onValueChange={(value) => setFormEdicao({ ...formEdicao, alunoId: value })}
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
              <Button onClick={salvarEdicao}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Responsáveis cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Alunos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responsaveis.map((responsavel) => (
                <TableRow key={responsavel.id}>
                  <TableCell className="font-medium">{responsavel.nome}</TableCell>
                  <TableCell>{responsavel.telefone}</TableCell>
                  <TableCell>
                    {responsavel.alunos.map((item) => item.aluno.nome).join(", ") || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => abrirEdicao(responsavel)}>
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
