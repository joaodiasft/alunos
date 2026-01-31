"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/client/api"
import { formatDate } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Log = {
  id: string
  acao: string
  entidade: string
  entidadeId?: string | null
  createdAt: string
  admin: { nome: string; email: string }
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<Log[]>([])

  useEffect(() => {
    apiFetch<Log[]>("/api/admin/logs").then(setLogs).catch(() => setLogs([]))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Logs do sistema</h1>
        <p className="text-sm text-muted-foreground">Auditoria de alterações administrativas.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas ações</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDate(log.createdAt)}</TableCell>
                  <TableCell>{log.admin.nome}</TableCell>
                  <TableCell>{log.acao}</TableCell>
                  <TableCell>{log.entidade}</TableCell>
                  <TableCell>{log.entidadeId ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
