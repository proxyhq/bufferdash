import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { ReportsSummary } from "@/components/reports-summary"
import { SpendingByCategory } from "@/components/spending-by-category"
import { MonthlySpending } from "@/components/monthly-spending"
import { StatementsTable } from "@/components/statements-table"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function ReportsPage() {
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
        <SiteHeader title="Reports" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="mx-auto w-full max-w-4xl flex flex-col gap-6 py-4 px-4 md:gap-8 md:py-6 lg:px-6">
              <ReportsSummary />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SpendingByCategory />
                <MonthlySpending />
              </div>
              <StatementsTable />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
