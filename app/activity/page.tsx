import { AppSidebar } from "@/components/app-sidebar"
import { ActivityTable, type ActivityItem } from "@/components/activity-table"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import rawData from "./data.json"

const data = rawData as ActivityItem[]

export default function ActivityPage() {
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
        <SiteHeader title="Activity" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="mx-auto w-full max-w-4xl flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <ActivityTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
