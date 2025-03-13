import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function ProfilePage() {
  return (
    <main id="profile-page" data-component="profile-page" className="dashboard-profile flex flex-1 flex-col gap-4 p-4 bg-white">
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <Avatar className="size-20">
              <AvatarImage src="/placeholder-user.svg" alt="User" />
              <AvatarFallback className="text-lg">JD</AvatarFallback>
            </Avatar>
            <div className="grid">
              <div className="text-xl font-semibold">John Doe</div>
              <div className="text-neutral-500">john@example.com</div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="text-neutral-500">Member since</div>
                <div>Jan 2023</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-neutral-500">Last active</div>
                <div>Today</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-neutral-500">Timezone</div>
                <div>GMT+1</div>
              </div>
              <Separator className="my-2" />
              <Button size="sm" className="w-full" variant="outline">
                Edit Basic Info
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="first-name">First name</Label>
                  <Input id="first-name" defaultValue="John" />
                </div>
                <div>
                  <Label htmlFor="last-name">Last name</Label>
                  <Input id="last-name" defaultValue="Doe" />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue="john@example.com" />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" defaultValue="+1 234 567 890" />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  defaultValue="I'm a software developer with a passion for building beautiful and functional web applications."
                />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Social Profiles</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div>
                <Label htmlFor="website">Website</Label>
                <Input id="website" defaultValue="https://example.com" />
              </div>
              <div>
                <Label htmlFor="github">GitHub</Label>
                <Input id="github" defaultValue="@johndoe" />
              </div>
              <div>
                <Label htmlFor="twitter">Twitter</Label>
                <Input id="twitter" defaultValue="@johndoe" />
              </div>
              <div>
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input id="linkedin" defaultValue="john-doe" />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button>Update Password</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
} 