"use client"

import { readSession } from "@/lib/client/session"
import { clearSession } from "@/lib/client/session"

export async function apiFetch<T>(url: string, init?: RequestInit) {
  const session = readSession()
  const headers = new Headers(init?.headers)
  headers.set("Content-Type", "application/json")
  if (session?.token) {
    headers.set("Authorization", `Bearer ${session.token}`)
  }

  const response = await fetch(url, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    if (response.status === 401 && typeof window !== "undefined") {
      clearSession()
      window.location.href = "/"
    }
    throw new Error(payload?.message ?? "Erro ao processar a requisição.")
  }

  return (await response.json()) as T
}
