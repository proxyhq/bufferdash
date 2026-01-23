import { IconShieldCheck } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface SiteHeaderProps {
  title?: string
  actionLabel?: string
}

export function SiteHeader({ title = "Dashboard", actionLabel = "Complete KYC" }: SiteHeaderProps) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="mx-auto flex w-full max-w-4xl items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <IconShieldCheck className="size-4" />
            <span>{actionLabel}</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
