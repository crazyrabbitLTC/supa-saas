"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { SidebarProvider } from "@/components/ui/sidebar"
import { DashboardDebug } from "@/components/dashboard-debug"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DashboardDebug />
      <div id="dashboard-root" className="fixed inset-0 z-50 bg-white">
        <SidebarProvider>
          <div className="flex h-full flex-col">
            {/* Main Content with Sidebar */}
            <div className="flex flex-1 overflow-hidden">
              <AppSidebar />
              <div className="flex-1 flex flex-col overflow-hidden w-full">
                <DashboardHeader />
                <div className="flex-1 overflow-auto">
                  {children}
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className="shrink-0 border-t border-neutral-200 bg-white p-4 text-center text-sm text-neutral-500">
              <div className="mx-auto max-w-7xl">
                <p>© 2024 Supa SaaS. All rights reserved.</p>
              </div>
            </footer>
          </div>
        </SidebarProvider>
      </div>
    </>
  )
} 