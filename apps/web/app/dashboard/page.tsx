import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function Page() {
  return (
    <SidebarProvider>
      <div className="flex h-screen flex-col">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 bg-white border-b border-neutral-200 px-4 z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Overview</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        {/* Main Content with Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <div className="flex-1 overflow-auto">
            <main className="flex flex-1 flex-col gap-4 p-4 bg-white">
              <div className="mb-4">
                <h1 className="text-2xl font-bold mb-2 text-neutral-900">Welcome to your Dashboard</h1>
                <p className="text-neutral-600">Here's an overview of your recent activity and stats.</p>
              </div>
              <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <div className="aspect-video rounded-xl bg-neutral-100 border border-neutral-200 p-4 flex flex-col">
                  <h3 className="font-medium text-neutral-900 mb-1">Total Users</h3>
                  <p className="text-2xl font-bold text-neutral-900">2,458</p>
                  <span className="text-sm text-neutral-500 mt-auto">+12% from last week</span>
                </div>
                <div className="aspect-video rounded-xl bg-neutral-100 border border-neutral-200 p-4 flex flex-col">
                  <h3 className="font-medium text-neutral-900 mb-1">Revenue</h3>
                  <p className="text-2xl font-bold text-neutral-900">$12,580</p>
                  <span className="text-sm text-neutral-500 mt-auto">+8% from last month</span>
                </div>
                <div className="aspect-video rounded-xl bg-neutral-100 border border-neutral-200 p-4 flex flex-col">
                  <h3 className="font-medium text-neutral-900 mb-1">Active Projects</h3>
                  <p className="text-2xl font-bold text-neutral-900">18</p>
                  <span className="text-sm text-neutral-500 mt-auto">3 added this week</span>
                </div>
              </div>
              <div className="min-h-[40vh] flex-1 rounded-xl bg-neutral-100 border border-neutral-200 md:min-h-min p-4">
                <h2 className="text-lg font-semibold mb-4 text-neutral-900">Recent Activity</h2>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="flex items-center justify-between p-3 border border-neutral-200 bg-white rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-700">
                          {item}
                        </div>
                        <div>
                          <h4 className="font-medium text-neutral-900">Activity Item {item}</h4>
                          <p className="text-sm text-neutral-500">Updated {item} hour{item !== 1 ? 's' : ''} ago</p>
                        </div>
                      </div>
                      <span className="text-neutral-500 text-sm">Details</span>
                    </div>
                  ))}
                </div>
              </div>
            </main>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-neutral-200 bg-white p-4 text-center text-sm text-neutral-500">
          <div className="mx-auto max-w-7xl">
            <p>© 2024 Supa SaaS. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </SidebarProvider>
  )
} 