import { ReactNode } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { RoleGuard } from "@/components/auth/role-guard"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowed={["ADMIN"]}>
      <AppShell>{children}</AppShell>
    </RoleGuard>
  )
}
