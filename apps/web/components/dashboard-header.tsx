"use client"

import React from "react"
import { usePathname } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface DashboardHeaderProps {
  currentPage?: string
  breadcrumbs?: {
    title: string
    href?: string
  }[]
}

export function DashboardHeader({
  currentPage,
  breadcrumbs = [],
}: DashboardHeaderProps) {
  const pathname = usePathname()
  
  // Dynamically generate breadcrumbs and current page if not provided
  const pathSegments = pathname.split('/').filter(Boolean)
  const generatedCurrentPage = currentPage || 
    (pathSegments.length > 1 ? 
      pathSegments[pathSegments.length - 1].charAt(0).toUpperCase() + 
      pathSegments[pathSegments.length - 1].slice(1) : 
      'Dashboard')
  
  // Generate breadcrumbs from path segments if none provided
  const generatedBreadcrumbs = breadcrumbs.length > 0 ? breadcrumbs : 
    pathSegments.length > 1 ?
      [{ title: generatedCurrentPage }] :
      []

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center bg-background border-b border-border w-full">
      <div className="flex w-full items-center px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              
              {generatedBreadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem className="hidden md:block">
                    {crumb.href ? (
                      <BreadcrumbLink href={crumb.href}>{crumb.title}</BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
    </header>
  )
} 