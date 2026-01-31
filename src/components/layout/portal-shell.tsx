import { ReactNode } from "react"

type PortalShellProps = {
  title: string
  subtitle: string
  action?: ReactNode
  children: ReactNode
}

export function PortalShell({ title, subtitle, action, children }: PortalShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/90 px-6 py-6 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">{title}</div>
            <div className="text-sm text-muted-foreground">{subtitle}</div>
          </div>
          {action}
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-6 py-6">{children}</main>
    </div>
  )
}
