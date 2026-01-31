"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/client/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Professor = {
  id: string
  nome: string
  email?: string
  telefone?: string
}

export default function AdminProfessoresPage() {
  const [professores, setProfessores] = useState<Professor[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ nome: "", email: "", telefone: "" })

  async function carregar() {
    try {
      const data = await apiFetch<Professor[]>("/api/admin/professores")
      setProfessores(data)
    } catch {
      setProfessores([])
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  async function salvar() {
    await apiFetch("/api/admin/professores", {
      method: "POST",
      body: JSON.stringify(form),
    })
    setOpen(false)
    setForm({ nome: "", email: "", telefone: "" })
    await carregar()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Professores</h1>
          <p className="text-sm text-muted-foreground">Cadastro de docentes.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Novo professor</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastro de professor</DialogTitle>
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
                <Label>Email</Label>
                <Input
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Telefone</Label>
                <Input
                  value={form.telefone}
                  onChange={(event) => setForm({ ...form, telefone: event.target.value })}
                />
              </div>
              <Button onClick={salvar}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de professores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {professores.map((professor) => (
                <TableRow key={professor.id}>
                  <TableCell className="font-medium">{professor.nome}</TableCell>
                  <TableCell>{professor.email ?? "-"}</TableCell>
                  <TableCell>{professor.telefone ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
