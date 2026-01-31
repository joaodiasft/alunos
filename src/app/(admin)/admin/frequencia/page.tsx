"use client"

import { useEffect, useMemo, useState } from "react"
import { apiFetch } from "@/lib/client/api"
import { formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Aula = {
  id: string
  data: string
  turma: { id: string; nome: string }
  disciplina?: { nome: string } | null
}

type Aluno = {
  id: string
  nome: string
  turmas: { turma: { id: string } }[]
}

type Status = "PRESENTE" | "FALTA" | "JUSTIFICADA"
type Frequencia = {
  alunoId: string
  status: Status
}

export default function AdminFrequenciaPage() {
  const [aulas, setAulas] = useState<Aula[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [aulaId, setAulaId] = useState("")
  const [registros, setRegistros] = useState<Record<string, Status>>({})
  const [month, setMonth] = useState("")

  useEffect(() => {
    const query = month ? `?month=${month}` : ""
    Promise.all([apiFetch<Aula[]>(`/api/admin/aulas${query}`), apiFetch<Aluno[]>("/api/admin/alunos")])
      .then(([aulasData, alunosData]) => {
        setAulas(aulasData)
        setAlunos(alunosData)
      })
      .catch(() => {
        setAulas([])
        setAlunos([])
      })
  }, [month])

  const aulaSelecionada = useMemo(
    () => aulas.find((aula) => aula.id === aulaId),
    [aulas, aulaId]
  )

  const aulasUnicas = useMemo(() => {
    const map = new Map<string, Aula>()
    aulas.forEach((aula) => {
      if (!map.has(aula.id)) {
        map.set(aula.id, aula)
      }
    })
    return Array.from(map.values())
  }, [aulas])

  const alunosDaTurma = useMemo(() => {
    if (!aulaSelecionada) return []
    return alunos.filter((aluno) => aluno.turmas.some((t) => t.turma.id === aulaSelecionada.turma.id))
  }, [alunos, aulaSelecionada])

  useEffect(() => {
    if (!aulaId) return
    apiFetch<Frequencia[]>(`/api/admin/frequencia?aulaId=${aulaId}`)
      .then((dados) => {
        const mapa: Record<string, Status> = {}
        dados.forEach((item) => {
          mapa[item.alunoId] = item.status
        })
        setRegistros(mapa)
      })
      .catch(() => setRegistros({}))
  }, [aulaId])

  async function salvar() {
    if (!aulaId) return
    const payload = alunosDaTurma.map((aluno) => ({
      alunoId: aluno.id,
      status: registros[aluno.id] ?? "PRESENTE",
    }))
    await apiFetch("/api/admin/frequencia", {
      method: "POST",
      body: JSON.stringify({ aulaId, registros: payload }),
    })
    const atualizados = await apiFetch<Frequencia[]>(`/api/admin/frequencia?aulaId=${aulaId}`)
    const mapa: Record<string, Status> = {}
    atualizados.forEach((item) => {
      mapa[item.alunoId] = item.status
    })
    setRegistros(mapa)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Frequência</h1>
        <p className="text-sm text-muted-foreground">Lançamento por aula e disciplina.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecionar aula</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Mês</Label>
            <Input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Aula</Label>
            <Select value={aulaId} onValueChange={setAulaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a aula" />
              </SelectTrigger>
              <SelectContent>
                {aulasUnicas.map((aula) => (
                  <SelectItem key={aula.id} value={aula.id}>
                    {formatDate(aula.data)} - {aula.turma.nome}{" "}
                    {aula.disciplina?.nome ? `(${aula.disciplina.nome})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={salvar} disabled={!aulaId}>
            Salvar frequência
          </Button>
        </CardContent>
      </Card>

      {aulaSelecionada ? (
        <Card>
          <CardHeader>
            <CardTitle>Lista de alunos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alunosDaTurma.map((aluno) => (
                  <TableRow key={aluno.id}>
                    <TableCell className="font-medium">{aluno.nome}</TableCell>
                    <TableCell className="max-w-xs">
                      <Select
                        value={registros[aluno.id] ?? "PRESENTE"}
                        onValueChange={(value) =>
                          setRegistros((prev) => ({ ...prev, [aluno.id]: value as Status }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRESENTE">Presente</SelectItem>
                          <SelectItem value="FALTA">Falta</SelectItem>
                          <SelectItem value="JUSTIFICADA">Justificada</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
