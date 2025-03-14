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
import { useAuth } from "@/components/providers/auth-provider"
import { ModeToggle } from "@/components/mode-toggle"

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
  const { user, isLoading } = useAuth();
  
  // Functions for user display
  const getUserInitials = () => {
    if (!user) return "U";
    
    if (user.user_metadata?.full_name) {
      const names = user.user_metadata.full_name.split(' ');
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
      }
      return names[0].charAt(0).toUpperCase();
    }
    
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return "U";
  };
  
  const getDisplayName = () => {
    if (!user) return "User";
    
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    
    if (user.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    
    return "User";
  };

  // Create user data for NavUser component
  const userData = {
    name: getDisplayName(),
    email: user?.email || "user@example.com",
    avatar: user?.user_metadata?.avatar_url || "/placeholder-user.svg"
  };

  return (
    <Sidebar className="border-r border-border flex flex-col h-full">
      <SidebarHeader>
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <Avatar className="size-7 rounded-sm">
              <AvatarImage src="/app-logo.svg" alt="App Logo" />
              <AvatarFallback className="rounded-sm bg-muted text-foreground">
                SP
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-semibold text-foreground">
                Supa SaaS
              </div>
              <div className="text-xs text-muted-foreground">
                Dashboard
              </div>
            </div>
          </div>
          <ModeToggle />
        </div>
      </SidebarHeader>

      <ScrollArea className="flex-1">
        <SidebarContent>
          <SidebarGroup className="px-3 py-1.5">
            <SidebarMenu>
              <SidebarMenuButton asChild className="bg-secondary/20 text-secondary-foreground hover:bg-secondary/30">
                <Link href="/dashboard?auth=true">
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
                  url: "/dashboard/profile?auth=true",
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
                <Link href="/dashboard/settings?auth=true">
                  <Settings className="size-4" />
                  Settings
                </Link>
              </SidebarMenuButton>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </ScrollArea>

      <SidebarFooter className="mt-auto border-t border-border px-3 py-2">
        {isLoading ? (
          <div className="px-3 py-2">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-muted animate-pulse"></div>
              <div className="space-y-1">
                <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                <div className="h-3 w-32 bg-muted rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ) : (
          <NavUser user={userData} />
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
