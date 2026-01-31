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
        </div>
      </PortalShell>
    </RoleGuard>
  )
}
