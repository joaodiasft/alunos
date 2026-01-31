"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { apiFetch } from "@/lib/client/api"
import { formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Option = { id: string; nome: string }

type Aula = {
  id: string
  data: string
  turma: Option
  professor?: Option | null
  disciplina?: Option | null
}

export default function AdminAulasPage() {
  const [aulas, setAulas] = useState<Aula[]>([])
  const [turmas, setTurmas] = useState<Option[]>([])
  const [professores, setProfessores] = useState<Option[]>([])
  const [disciplinas, setDisciplinas] = useState<Option[]>([])
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState("")
  const [form, setForm] = useState({
    turmaId: "",
    datas: [""] as string[],
    entradas: [{ disciplinaId: "", professorId: "" }] as {
      disciplinaId: string
      professorId: string
    }[],
  })

  const carregar = useCallback(async () => {
    try {
      const query = month ? `?month=${month}` : ""
      const [aulasData, turmasData, professoresData, disciplinasData] = await Promise.all([
        apiFetch<Aula[]>(`/api/admin/aulas${query}`),
        apiFetch<Option[]>("/api/admin/turmas"),
        apiFetch<Option[]>("/api/admin/professores"),
        apiFetch<Option[]>("/api/admin/disciplinas"),
      ])
      setAulas(aulasData)
      setTurmas(turmasData)
      setProfessores(professoresData)
      setDisciplinas(disciplinasData)
    } catch {
      setAulas([])
      setTurmas([])
      setProfessores([])
      setDisciplinas([])
    }
  }, [month])

  useEffect(() => {
    carregar()
  }, [month])

  const aulasUnicas = useMemo(() => {
    const map = new Map<string, Aula>()
    aulas.forEach((aula) => {
      const key = [
        aula.turma.id,
        new Date(aula.data).toISOString(),
        aula.disciplina?.id ?? "null",
        aula.professor?.id ?? "null",
      ].join("|")
      if (!map.has(key)) map.set(key, aula)
    })
    return Array.from(map.values())
  }, [aulas])

  async function removerDuplicadas() {
    const confirmar = window.confirm("Deseja remover aulas duplicadas deste calendário?")
    if (!confirmar) return
    await apiFetch("/api/admin/aulas", { method: "DELETE" })
    await carregar()
  }

  async function salvar() {
    await apiFetch("/api/admin/aulas", {
      method: "POST",
      body: JSON.stringify({
        turmaId: form.turmaId,
        datas: form.datas.filter(Boolean),
        entradas: form.entradas.map((entrada) => ({
          disciplinaId: entrada.disciplinaId || undefined,
          professorId: entrada.professorId || undefined,
        })),
      }),
    })
    setOpen(false)
    setForm({
      turmaId: "",
      datas: [""],
      entradas: [{ disciplinaId: "", professorId: "" }],
    })
    await carregar()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Aulas</h1>
          <p className="text-sm text-muted-foreground">Calendário e registros de aula.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Nova aula</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastro de aula</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Turma</Label>
                <Select
                  value={form.turmaId}
                  onValueChange={(value) => setForm({ ...form, turmaId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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
                <Label>Datas (até 4)</Label>
                <div className="grid gap-2">
                  {form.datas.map((data, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="datetime-local"
                        value={data}
                        onChange={(event) => {
                          const datas = [...form.datas]
                          datas[index] = event.target.value
                          setForm({ ...form, datas })
                        }}
                      />
                      {form.datas.length > 1 ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const datas = form.datas.filter((_, i) => i !== index)
                            setForm({ ...form, datas })
                          }}
                        >
                          Remover
                        </Button>
                      ) : null}
                    </div>
                  ))}
                  {form.datas.length < 4 ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setForm({ ...form, datas: [...form.datas, ""] })}
                    >
                      Adicionar data
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Disciplinas e professores (Exatas: 3)</Label>
                <div className="grid gap-3">
                  {form.entradas.map((entrada, index) => (
                    <div key={index} className="grid gap-2 rounded-md border border-border p-3">
                      <Select
                        value={entrada.disciplinaId}
                        onValueChange={(value) => {
                          const entradas = [...form.entradas]
                          entradas[index] = { ...entradas[index], disciplinaId: value }
                          setForm({ ...form, entradas })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Disciplina" />
                        </SelectTrigger>
                        <SelectContent>
                          {disciplinas.map((disciplina) => (
                            <SelectItem key={disciplina.id} value={disciplina.id}>
                              {disciplina.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={entrada.professorId}
                        onValueChange={(value) => {
                          const entradas = [...form.entradas]
                          entradas[index] = { ...entradas[index], professorId: value }
                          setForm({ ...form, entradas })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Professor" />
                        </SelectTrigger>
                        <SelectContent>
                          {professores.map((professor) => (
                            <SelectItem key={professor.id} value={professor.id}>
                              {professor.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.entradas.length > 1 ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const entradas = form.entradas.filter((_, i) => i !== index)
                            setForm({ ...form, entradas })
                          }}
                        >
                          Remover
                        </Button>
                      ) : null}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setForm({
                        ...form,
                        entradas: [...form.entradas, { disciplinaId: "", professorId: "" }],
                      })
                    }
                  >
                    Adicionar disciplina/professor
                  </Button>
                </div>
              </div>
              <Button onClick={salvar}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximas aulas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="grid gap-2 md:max-w-xs">
              <Label>Filtrar por mês</Label>
              <Input
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
              />
            </div>
            <Button variant="outline" onClick={removerDuplicadas}>
              Remover duplicadas
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead>Professor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aulasUnicas.map((aula) => (
                <TableRow key={aula.id}>
                  <TableCell>{formatDate(aula.data)}</TableCell>
                  <TableCell>{aula.turma.nome}</TableCell>
                  <TableCell>{aula.disciplina?.nome ?? "-"}</TableCell>
                  <TableCell>{aula.professor?.nome ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
