"use client"

import * as React from "react"
import Link from "next/link"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
  Car,
  LayoutDashboard,
  MessagesSquare,
  Settings,
  Users,
  User,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar() {
  return (
    <div className="h-full border-r border-neutral-200 bg-white overflow-hidden">
      <Sidebar className="h-full">
        <ScrollArea className="h-full pb-12">
          <SidebarGroup className="px-3 pb-1.5 pt-3">
            <div className="flex items-center gap-2 px-2.5">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="md:hidden" />
                <Avatar className="size-7 rounded-sm">
                  <AvatarImage src="/app-logo.svg" alt="App Logo" />
                  <AvatarFallback className="rounded-sm bg-neutral-100 text-neutral-900">
                    SP
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-900">
                  Supa SaaS
                </div>
                <div className="text-xs text-neutral-500">
                  Dashboard
                </div>
              </div>
            </div>
          </SidebarGroup>

          <SidebarGroup className="px-3 py-1.5">
            <SidebarMenu>
              <SidebarMenuButton asChild className="bg-neutral-200 text-neutral-700 hover:bg-neutral-300 hover:text-neutral-900">
                <Link href="/dashboard">
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Link>
              </SidebarMenuButton>
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup className="px-3 py-1.5">
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <NavMain
              items={[
                {
                  title: "Profile",
                  url: "/dashboard/profile",
                  icon: <User className="size-4" />,
                },
                {
                  title: "Users",
                  url: "#",
                  icon: <Users className="size-4" />,
                },
                {
                  title: "Vehicles",
                  url: "#",
                  icon: <Car className="size-4" />,
                },
                {
                  title: "Messages",
                  url: "#",
                  icon: <MessagesSquare className="size-4" />,
                },
              ]}
            />
          </SidebarGroup>

          <SidebarGroup className="px-3 py-1.5">
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuButton asChild>
                <Link href="/dashboard/settings">
                  <Settings className="size-4" />
                  Settings
                </Link>
              </SidebarMenuButton>
            </SidebarMenu>
          </SidebarGroup>
        </ScrollArea>

        <SidebarFooter>
          <Link href="/dashboard/profile" className="block">
            <div className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-100 transition-colors rounded-md cursor-pointer">
              <Avatar className="size-9">
                <AvatarImage src="/placeholder-user.svg" alt="User" />
                <AvatarFallback className="text-neutral-900 bg-neutral-100">
                  JD
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-0.5">
                <div className="text-sm font-medium text-neutral-900">
                  John Doe
                </div>
                <div className="text-xs text-neutral-500">
                  john@example.com
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto rounded-full"
                asChild
              >
                <Link href="/dashboard/settings">
                  <Settings className="size-4" />
                  <span className="sr-only">Settings</span>
                </Link>
              </Button>
            </div>
          </Link>
        </SidebarFooter>
      </Sidebar>
    </div>
  )
}
