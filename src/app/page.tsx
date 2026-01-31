"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { saveSession } from "@/lib/client/session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  const router = useRouter()
  const [admin, setAdmin] = useState({ email: "", senha: "", token: "" })
  const [aluno, setAluno] = useState({ token: "", telefone: "" })
  const [responsavel, setResponsavel] = useState({ nome: "", telefone: "" })
  const [erro, setErro] = useState("")

  async function loginAdmin() {
    try {
      setErro("")
      const response = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(admin),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      saveSession({ token: data.token, role: "ADMIN" })
      router.push("/admin")
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao autenticar.")
    }
  }

  async function loginAluno() {
    try {
      setErro("")
      const response = await fetch("/api/auth/aluno/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aluno),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      saveSession({ token: data.token, role: "ALUNO", alunoId: data.alunoId })
      router.push("/portal/aluno")
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao autenticar.")
    }
  }

  async function loginResponsavel() {
    try {
      setErro("")
      const response = await fetch("/api/auth/responsavel/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(responsavel),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      saveSession({ token: data.token, role: "RESPONSAVEL", responsavelId: data.responsavelId })
      router.push("/portal/responsavel")
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao autenticar.")
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">RMIL Gestão Escolar</h1>
          <p className="text-sm text-muted-foreground">
            Sistema completo para administração, alunos e responsáveis.
          </p>
        </div>

        {erro ? (
          <Card className="border-danger">
            <CardContent className="py-3 text-sm text-danger-foreground bg-danger">
              {erro}
            </CardContent>
          </Card>
        ) : null}

        <Tabs defaultValue="admin" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="admin">Admin</TabsTrigger>
            <TabsTrigger value="aluno">Aluno</TabsTrigger>
            <TabsTrigger value="responsavel">Responsável</TabsTrigger>
          </TabsList>
          <TabsContent value="admin">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Acesso administrativo</CardTitle>
                <CardDescription>Email e senha do gestor.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={admin.email}
                    onChange={(event) => setAdmin({ ...admin, email: event.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Senha</Label>
                  <Input
                    type="password"
                    value={admin.senha}
                    onChange={(event) => setAdmin({ ...admin, senha: event.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Token de confirmação</Label>
                  <Input
                    value={admin.token}
                    onChange={(event) => setAdmin({ ...admin, token: event.target.value })}
                  />
                </div>
                <Button onClick={loginAdmin}>Entrar</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="aluno">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Portal do aluno</CardTitle>
                <CardDescription>Informe token e telefone.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Token</Label>
                  <Input
                    value={aluno.token}
                    onChange={(event) => setAluno({ ...aluno, token: event.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Telefone</Label>
                  <Input
                    value={aluno.telefone}
                    onChange={(event) => setAluno({ ...aluno, telefone: event.target.value })}
                  />
                </div>
                <Button onClick={loginAluno}>Entrar</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="responsavel">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Portal do responsável</CardTitle>
                <CardDescription>Informe nome e telefone.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Nome</Label>
                  <Input
                    value={responsavel.nome}
                    onChange={(event) =>
                      setResponsavel({ ...responsavel, nome: event.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Telefone</Label>
                  <Input
                    value={responsavel.telefone}
                    onChange={(event) =>
                      setResponsavel({ ...responsavel, telefone: event.target.value })
                    }
                  />
                </div>
                <Button onClick={loginResponsavel}>Entrar</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
