"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/client/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Disciplina = {
  id: string
  nome: string
}

export default function AdminDisciplinasPage() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState("")

  async function carregar() {
    try {
      const data = await apiFetch<Disciplina[]>("/api/admin/disciplinas")
      setDisciplinas(data)
    } catch {
      setDisciplinas([])
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  async function salvar() {
    await apiFetch("/api/admin/disciplinas", {
      method: "POST",
      body: JSON.stringify({ nome }),
    })
    setNome("")
    setOpen(false)
    await carregar()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Disciplinas</h1>
          <p className="text-sm text-muted-foreground">Cadastro de disciplinas.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Nova disciplina</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastro de disciplina</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Nome</Label>
                <Input value={nome} onChange={(event) => setNome(event.target.value)} />
              </div>
              <Button onClick={salvar}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de disciplinas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disciplinas.map((disciplina) => (
                <TableRow key={disciplina.id}>
                  <TableCell className="font-medium">{disciplina.nome}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
