import { ReactNode } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden border-border lg:block">
        <Sidebar />
      </div>
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <main className="flex-1 bg-muted/40 px-6 py-6">{children}</main>
      </div>
    </div>
  )
}
