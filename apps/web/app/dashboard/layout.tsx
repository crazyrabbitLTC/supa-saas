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
      <div id="dashboard-root" className="fixed inset-0 z-50 bg-background text-foreground flex">
        <SidebarProvider>
          <div className="flex flex-col w-full h-full">
            {/* Main Content with Sidebar */}
            <div className="flex flex-grow min-h-0 overflow-hidden">
              <AppSidebar />
              <div className="flex-1 flex flex-col w-full">
                <DashboardHeader />
                <main className="flex-1 overflow-y-auto">
                  <div className="p-6 md:p-8 min-h-full">
                    {children}
                  </div>
                </main>
              </div>
            </div>

            {/* Footer */}
            <footer className="w-full border-t border-border bg-background p-4 text-center text-sm text-muted-foreground">
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