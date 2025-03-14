"use client"

import Link from "next/link"
import { ChevronDown, ChevronRight } from "lucide-react"
import React from "react"

import { cn } from "@/lib/utils"
import { SidebarMenu, SidebarMenuButton } from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface NavMainProps extends React.HTMLAttributes<HTMLDivElement> {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    items?: {
      title: string
      url: string
      icon?: React.ReactNode
    }[]
  }[]
}

export function NavMain({ items, className, ...props }: NavMainProps) {
  // Function to add auth param to dashboard URLs
  const addAuthToUrl = (url: string) => {
    if (url.startsWith('#') || !url.includes('/dashboard')) {
      return url;
    }
    return url.includes('?') ? `${url}&auth=true` : `${url}?auth=true`;
  };

  return (
    <div className={cn("grid gap-1", className)} {...props}>
      <SidebarMenu>
        {items.map((item, index) => {
          if (item.items?.length) {
            return (
              <Collapsible key={index} className="grid">
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="w-full justify-between">
                    <div className="flex items-center">
                      {item.icon && <span className="mr-2">{item.icon}</span>}
                      {item.title}
                    </div>
                    <ChevronDown className="size-4 opacity-50" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="data-[state=closed]:hidden data-[state=open]:animate-none">
                  <SidebarMenu className="ml-4 border-l border-neutral-200 pl-2">
                    {item.items.map((subItem, subIndex) => (
                      <SidebarMenuButton key={subIndex} asChild size="sm">
                        <Link href={addAuthToUrl(subItem.url)}>
                          {subItem.icon && <span className="mr-2">{subItem.icon}</span>}
                          {subItem.title}
                        </Link>
                      </SidebarMenuButton>
                    ))}
                  </SidebarMenu>
                </CollapsibleContent>
              </Collapsible>
            )
          }

          return (
            <SidebarMenuButton key={index} asChild>
              <Link href={addAuthToUrl(item.url)}>
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.title}
              </Link>
            </SidebarMenuButton>
          )
        })}
      </SidebarMenu>
    </div>
  )
}
