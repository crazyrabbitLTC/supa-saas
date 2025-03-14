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
      <div id="dashboard-root" className="fixed inset-0 z-50 bg-white dark:bg-gray-950">
        <SidebarProvider>
          <div className="flex h-full flex-col">
            {/* Main Content with Sidebar */}
            <div className="flex flex-1 overflow-hidden">
              <AppSidebar />
              <div className="flex-1 flex flex-col overflow-hidden w-full">
                <DashboardHeader />
                <main className="flex-1 overflow-y-auto">
                  <div className="p-6 md:p-8 min-h-full">
                    {children}
                  </div>
                </main>
              </div>
            </div>

            {/* Footer */}
            <footer className="shrink-0 border-t border-neutral-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 text-center text-sm text-neutral-500 dark:text-gray-400">
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