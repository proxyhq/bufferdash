"use client"

import * as React from "react"
import {
  IconBasketExclamation,
  IconChevronRight,
  IconDashboard,
  IconFileAnalytics,
  IconGhost,
  IconHelp,
  IconListDetails,
  IconSettings,
  IconShieldCheck,
  IconTarget,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
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
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Activity",
      url: "/activity",
      icon: IconListDetails,
    },
    {
      title: "Intents",
      url: "/intents",
      icon: IconTarget,
    },
    {
      title: "Agents",
      url: "/agents",
      icon: IconGhost,
    },
    {
      title: "Disputes",
      url: "/disputes",
      icon: IconBasketExclamation,
    },
  ],
  settingsItems: [
    {
      title: "General",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Policies",
      url: "#",
      icon: IconShieldCheck,
    },
    {
      title: "Reports",
      url: "#",
      icon: IconFileAnalytics,
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
                <span className="text-xl">🛟</span>
                <span className="text-base font-semibold">Buffer</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="cursor-pointer">
                      <IconSettings />
                      <span>Settings</span>
                      <IconChevronRight className="ml-auto size-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" className="w-48">
                    {data.settingsItems.map((item) => (
                      <DropdownMenuItem key={item.title} asChild>
                        <a href={item.url} className="flex items-center gap-2">
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </a>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="#">
                    <IconHelp />
                    <span>Get Help</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
