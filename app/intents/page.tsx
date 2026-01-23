import { AppSidebar } from "@/components/app-sidebar"
import { IntentsTable, type IntentItem } from "@/components/intents-table"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import rawData from "./data.json"

const data = rawData as IntentItem[]

export default function IntentsPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Intents" actionLabel="New Intent" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="mx-auto w-full max-w-4xl flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <IntentsTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
