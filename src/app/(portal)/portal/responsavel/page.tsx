"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { RoleGuard } from "@/components/auth/role-guard"
import { PortalShell } from "@/components/layout/portal-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiFetch } from "@/lib/client/api"
import { formatCurrency, formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { clearSession } from "@/lib/client/session"

type Summary = {
  responsavel: { nome: string }
  alunos: { id: string; nome: string; token: string }[]
  financeiro: {
    id: string
    referencia: string
    valorFinal: number
    vencimento: string
    status: string
    aluno: { nome: string }
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
    aluno: { nome: string }
    turma?: { nome: string } | null
  }[]
}

export default function PortalResponsavelPage() {
  const router = useRouter()
  const [data, setData] = useState<Summary | null>(null)

  useEffect(() => {
    apiFetch<Summary>("/api/portal/responsavel/summary").then(setData).catch(() => setData(null))
  }, [])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    clearSession()
    router.push("/")
  }

  return (
    <RoleGuard allowed={["RESPONSAVEL"]}>
      <PortalShell
        title="Portal do responsável"
        subtitle="Acompanhe frequência e financeiro dos alunos."
        action={
          <Button variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        }
      >
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Responsável</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {data?.responsavel.nome ?? "-"}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alunos vinculados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Token</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.alunos.map((aluno) => (
                    <TableRow key={aluno.id}>
                      <TableCell>{aluno.nome}</TableCell>
                      <TableCell>{aluno.token}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Referência</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.financeiro.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.aluno.nome}</TableCell>
                      <TableCell>{item.referencia}</TableCell>
                      <TableCell>{formatDate(item.vencimento)}</TableCell>
                      <TableCell>{formatCurrency(item.valorFinal)}</TableCell>
                      <TableCell>{item.status}</TableCell>
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
                    <TableHead>Aluno</TableHead>
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
                        <TableCell className="font-medium">{nota.aluno.nome}</TableCell>
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
                      <TableCell colSpan={11} className="text-sm text-muted-foreground">
                        Nenhuma nota lançada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </PortalShell>
    </RoleGuard>
  )
}
