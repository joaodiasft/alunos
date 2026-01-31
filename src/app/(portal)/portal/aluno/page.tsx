"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { RoleGuard } from "@/components/auth/role-guard"
import { PortalShell } from "@/components/layout/portal-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiFetch } from "@/lib/client/api"
import { formatCurrency, formatDate, formatPercent } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { clearSession } from "@/lib/client/session"

type Summary = {
  aluno: { nome: string; token: string }
  aulas: { id: string; data: string; disciplina?: { nome: string } | null; turma: { nome: string } }[]
  referenciaAtual: string
  frequencia: {
    total: number
    presentes: number
    percentual: number
    porDisciplina: { disciplina: string; total: number; presentes: number }[]
  }
  avisos: { id: string; titulo: string; mensagem: string; createdAt: string }[]
  financeiro: {
    id: string
    referencia: string
    valorFinal: number
    vencimento: string
    status: string
    aprovacao: string
    turma: { nome: string }
  }[]
  redacoes: {
    id: string
    referencia: string
    competencia1: number
    competencia2: number
    competencia3: number
    competencia4: number
    competencia5: number
    total: number
    observacoes?: string | null
    turma?: { nome: string } | null
  }[]
}

export default function PortalAlunoPage() {
  const router = useRouter()
  const [data, setData] = useState<Summary | null>(null)

  useEffect(() => {
    apiFetch<Summary>("/api/portal/aluno/summary").then(setData).catch(() => setData(null))
  }, [])

  const pendentes = useMemo(
    () => data?.financeiro.filter((item) => item.status !== "PAGO") ?? [],
    [data]
  )
  const pagos = useMemo(
    () => data?.financeiro.filter((item) => item.status === "PAGO") ?? [],
    [data]
  )

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    clearSession()
    router.push("/")
  }

  return (
    <RoleGuard allowed={["ALUNO"]}>
      <PortalShell
        title="Portal do aluno"
        subtitle="Acompanhe aulas, frequência e financeiro."
        action={
          <Button variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        }
      >
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Avisos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data?.avisos?.length ? (
                data.avisos.map((aviso) => (
                  <div key={aviso.id} className="rounded-md border border-border p-3">
                    <div className="text-sm font-medium">{aviso.titulo}</div>
                    <div className="text-sm text-muted-foreground">{aviso.mensagem}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(aviso.createdAt)}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">Sem avisos no momento.</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-6">
              <div>
                <div className="text-sm text-muted-foreground">Aluno</div>
                <div className="text-lg font-semibold">{data?.aluno.nome ?? "-"}</div>
                <div className="text-xs text-muted-foreground">{data?.aluno.token ?? "-"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Frequência geral</div>
                <div className="text-lg font-semibold">
                  {data ? formatPercent(data.frequencia.percentual) : "-"}
                </div>
                {data && data.frequencia.percentual < 0.75 ? (
                  <Badge className="mt-2 bg-warning text-warning-foreground">
                    Atenção: frequência abaixo do mínimo
                  </Badge>
                ) : null}
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Pendências financeiras</div>
                <div className="text-lg font-semibold">{pendentes.length}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aulas do mês {data?.referenciaAtual ?? ""}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Disciplina</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.aulas.map((aula) => (
                    <TableRow key={aula.id}>
                      <TableCell>{formatDate(aula.data)}</TableCell>
                      <TableCell>{aula.turma.nome}</TableCell>
                      <TableCell>{aula.disciplina?.nome ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Frequência por disciplina</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Presença</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.frequencia.porDisciplina.map((disciplina) => (
                    <TableRow key={disciplina.disciplina}>
                      <TableCell>{disciplina.disciplina}</TableCell>
                      <TableCell>
                        {formatPercent(disciplina.presentes / (disciplina.total || 1))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notas de redação por competência</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referência</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>C1</TableHead>
                    <TableHead>C2</TableHead>
                    <TableHead>C3</TableHead>
                    <TableHead>C4</TableHead>
                    <TableHead>C5</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.redacoes?.length ? (
                    data.redacoes.map((nota) => (
                      <TableRow key={nota.id}>
                        <TableCell>{nota.referencia}</TableCell>
                        <TableCell>{nota.turma?.nome ?? "-"}</TableCell>
                        <TableCell>{nota.competencia1}</TableCell>
                        <TableCell>{nota.competencia2}</TableCell>
                        <TableCell>{nota.competencia3}</TableCell>
                        <TableCell>{nota.competencia4}</TableCell>
                        <TableCell>{nota.competencia5}</TableCell>
                        <TableCell className="font-medium">{nota.total}</TableCell>
                        <TableCell>{nota.observacoes ?? "-"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-sm text-muted-foreground">
                        Nenhuma nota lançada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pendentes">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
                  <TabsTrigger value="pagos">Pagos</TabsTrigger>
                </TabsList>
                <TabsContent value="pendentes" className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Turma</TableHead>
                        <TableHead>Referência</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendentes.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.turma.nome}</TableCell>
                          <TableCell>{item.referencia}</TableCell>
                          <TableCell>{formatDate(item.vencimento)}</TableCell>
                          <TableCell>{formatCurrency(item.valorFinal)}</TableCell>
                          <TableCell>
                            <Badge className="bg-warning text-warning-foreground">
                              {item.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="pagos" className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Turma</TableHead>
                        <TableHead>Mês pago</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagos.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.turma.nome}</TableCell>
                          <TableCell>{item.referencia}</TableCell>
                          <TableCell>{formatDate(item.vencimento)}</TableCell>
                          <TableCell>{formatCurrency(item.valorFinal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </PortalShell>
    </RoleGuard>
  )
}
