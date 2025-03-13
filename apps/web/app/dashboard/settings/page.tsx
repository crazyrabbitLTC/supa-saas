import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  return (
    <main id="settings-page" data-component="settings-page" className="dashboard-settings flex flex-1 flex-col gap-4 p-4 bg-white">
      <div className="grid gap-6">
        <Tabs defaultValue="general">
          <div className="border-b">
            <TabsList className="w-full justify-start rounded-none border-b px-0 mb-0">
              <TabsTrigger 
                value="general" 
                className="rounded-b-none px-6 data-[state=active]:border-primary data-[state=active]:border-b-2"
              >
                General
              </TabsTrigger>
              <TabsTrigger 
                value="profile" 
                className="rounded-b-none px-6 data-[state=active]:border-primary data-[state=active]:border-b-2"
              >
                Profile
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="rounded-b-none px-6 data-[state=active]:border-primary data-[state=active]:border-b-2"
              >
                Notifications
              </TabsTrigger>
              <TabsTrigger 
                value="billing" 
                className="rounded-b-none px-6 data-[state=active]:border-primary data-[state=active]:border-b-2"
              >
                Billing
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="general" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Manage your account settings and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" placeholder="m@example.com" defaultValue="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" placeholder="johndoe" defaultValue="johndoe" />
                </div>
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="light-theme" className="flex cursor-pointer items-center space-x-2">
                      <input 
                        id="light-theme" 
                        type="radio" 
                        name="theme" 
                        className="peer sr-only" 
                        defaultChecked
                      />
                      <span className="size-4 rounded-full border border-primary shrink-0 bg-white peer-checked:bg-primary peer-checked:border-primary"></span>
                      <span>Light</span>
                    </Label>
                    <Label htmlFor="dark-theme" className="flex cursor-pointer items-center space-x-2">
                      <input 
                        id="dark-theme" 
                        type="radio" 
                        name="theme" 
                        className="peer sr-only" 
                      />
                      <span className="size-4 rounded-full border border-neutral-200 shrink-0 bg-white peer-checked:bg-primary peer-checked:border-primary"></span>
                      <span>Dark</span>
                    </Label>
                    <Label htmlFor="system-theme" className="flex cursor-pointer items-center space-x-2">
                      <input 
                        id="system-theme" 
                        type="radio" 
                        name="theme" 
                        className="peer sr-only"
                      />
                      <span className="size-4 rounded-full border border-neutral-200 shrink-0 bg-white peer-checked:bg-primary peer-checked:border-primary"></span>
                      <span>System</span>
                    </Label>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="profile" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Update your profile information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input id="full-name" placeholder="John Doe" defaultValue="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-bio">Bio</Label>
                  <Textarea 
                    id="profile-bio" 
                    placeholder="Tell us about yourself" 
                    defaultValue="I'm a software developer with a passion for building beautiful and functional web applications."
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how you receive notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Notifications</h3>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-marketing">Marketing emails</Label>
                      <p className="text-sm text-neutral-500">Receive emails about new products, features, and more.</p>
                    </div>
                    <Switch id="email-marketing" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-updates">Product updates</Label>
                      <p className="text-sm text-neutral-500">Receive emails about updates to products you use.</p>
                    </div>
                    <Switch id="email-updates" defaultChecked />
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Push Notifications</h3>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-everything">Everything</Label>
                      <p className="text-sm text-neutral-500">Receive all push notifications.</p>
                    </div>
                    <Switch id="push-everything" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-mentions">Mentions</Label>
                      <p className="text-sm text-neutral-500">Receive push notifications when you're mentioned.</p>
                    </div>
                    <Switch id="push-mentions" defaultChecked />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Preferences</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="billing" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
                <CardDescription>
                  Manage your billing information and view your billing history.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Current Plan</h3>
                  <div className="rounded-lg border border-neutral-200 p-4">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-semibold">Professional Plan</h4>
                        <p className="text-sm text-neutral-500">$29/month, billed monthly</p>
                      </div>
                      <Button variant="outline" size="sm">Change Plan</Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Payment Method</h3>
                  <div className="rounded-lg border border-neutral-200 p-4">
                    <div className="flex justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="size-10 rounded-md bg-neutral-100 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6">
                            <rect width="20" height="14" x="2" y="5" rx="2" />
                            <line x1="2" x2="22" y1="10" y2="10" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">Visa ending in 4242</p>
                          <p className="text-sm text-neutral-500">Expires 12/2025</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">Add Payment Method</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
} 