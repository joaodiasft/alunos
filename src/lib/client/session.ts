"use client"

export type SessionPayload = {
  token: string
  role: "ADMIN" | "ALUNO" | "RESPONSAVEL"
  alunoId?: string
  responsavelId?: string
}

const STORAGE_KEY = "rmil.session"

export function saveSession(payload: SessionPayload) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function readSession(): SessionPayload | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionPayload
  } catch {
    return null
  }
}

export function clearSession() {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}
