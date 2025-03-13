import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
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
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Settings</BreadcrumbPage>
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
                <h1 className="text-2xl font-bold mb-2 text-neutral-900">Settings</h1>
                <p className="text-neutral-600">Manage your account settings and preferences.</p>
              </div>
              
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general">
                  <Card>
                    <CardHeader>
                      <CardTitle>General Settings</CardTitle>
                      <CardDescription>
                        Manage your basic account settings.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" defaultValue="john@example.com" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input id="username" defaultValue="johndoe" />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Theme Preferences</h3>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="dark-mode">Dark Mode</Label>
                            <p className="text-sm text-neutral-500">
                              Switch between light and dark theme
                            </p>
                          </div>
                          <Switch id="dark-mode" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="system-theme">Use System Theme</Label>
                            <p className="text-sm text-neutral-500">
                              Follow your system's theme settings
                            </p>
                          </div>
                          <Switch id="system-theme" defaultChecked />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button>Save Changes</Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="profile">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Settings</CardTitle>
                      <CardDescription>
                        Update your profile information and visibility.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="full-name">Full Name</Label>
                          <Input id="full-name" defaultValue="John Doe" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Input id="bio" defaultValue="Software engineer and enthusiast" />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button>Update Profile</Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="notifications">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                      <CardDescription>
                        Choose how and when you want to be notified.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="email-notifications">Email Notifications</Label>
                            <p className="text-sm text-neutral-500">
                              Receive updates via email
                            </p>
                          </div>
                          <Switch id="email-notifications" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="push-notifications">Push Notifications</Label>
                            <p className="text-sm text-neutral-500">
                              Receive notifications in-app
                            </p>
                          </div>
                          <Switch id="push-notifications" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="marketing-notifications">Marketing Emails</Label>
                            <p className="text-sm text-neutral-500">
                              Receive promotional content
                            </p>
                          </div>
                          <Switch id="marketing-notifications" />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button>Save Preferences</Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="billing">
                  <Card>
                    <CardHeader>
                      <CardTitle>Billing Information</CardTitle>
                      <CardDescription>
                        Manage your billing details and subscription plan.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="p-4 border border-neutral-200 rounded-lg bg-neutral-50">
                        <div className="flex justify-between mb-2">
                          <h3 className="font-medium">Current Plan</h3>
                          <span className="text-sm text-white bg-neutral-700 px-2 py-0.5 rounded-full">
                            Pro
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 mb-4">
                          Your plan renews on January 1, 2024
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Price</div>
                          <div className="font-medium">$29/month</div>
                          <div>Billing cycle</div>
                          <div className="font-medium">Monthly</div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Payment Method</h3>
                        <div className="flex items-center gap-4 p-3 border border-neutral-200 rounded-lg">
                          <div className="w-10 h-6 bg-neutral-200 rounded"></div>
                          <div>
                            <p className="font-medium">•••• •••• •••• 4242</p>
                            <p className="text-sm text-neutral-500">Expires 12/2025</p>
                          </div>
                          <Button variant="outline" className="ml-auto" size="sm">
                            Change
                          </Button>
                        </div>
                        <Button variant="outline" className="w-full">Add Payment Method</Button>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline">Cancel Subscription</Button>
                      <Button>Upgrade Plan</Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
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