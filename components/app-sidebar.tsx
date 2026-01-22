"use client"

import * as React from "react"
import {
  IconBasketExclamation,
  IconCreditCard,
  IconDashboard,
  IconFileAnalyticsFilled,
  IconGhost,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconSettings,
  IconTarget,
  IconWallet,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Home",
      url: "#",
      icon: IconDashboard,
    },
    {
      title: "Agents",
      url: "#",
      icon: IconGhost,
    },
    {
      title: "Wallets",
      url: "#",
      icon: IconWallet,
    },
    {
      title: "Cards",
      url: "#",
      icon: IconCreditCard,
    },
    {
      title: "Transactions",
      url: "#",
      icon: IconListDetails,
    },
    {
      title: "Intents",
      url: "#",
      icon: IconTarget,
    },
    {
      title: "Disputes",
      url: "#",
      icon: IconBasketExclamation,
    },
    {
      title: "Reports",
      url: "#",
      icon: IconFileAnalyticsFilled,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
