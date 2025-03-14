"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ColorPaletteDemo } from "@/components/color-palette-demo"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function DesignDemo() {
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  
  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold">shadcn/ui Components Demo</h1>
      <p className="text-muted-foreground">A showcase of shadcn/ui components with our custom theme</p>
      
      <Tabs defaultValue="buttons" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-4">
          <TabsTrigger value="buttons">Buttons</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
        </TabsList>
        
        <TabsContent value="buttons" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Primary Buttons</CardTitle>
                <CardDescription>Default, hover, and focus states</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button>Default</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link Button</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
                <CardDescription>Status and information indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-success">Success</Badge>
                  <Badge className="bg-warning">Warning</Badge>
                  <Badge className="bg-destructive">Error</Badge>
                  <Badge className="bg-info">Info</Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Dropdown</CardTitle>
                <CardDescription>Interactive dropdown menu</CardDescription>
              </CardHeader>
              <CardContent>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>Open Menu</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Profile</DropdownMenuItem>
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                    <DropdownMenuItem>Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Alert Dialog</CardTitle>
                <CardDescription>Confirmation dialogs</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                  <AlertDialogTrigger asChild>
                    <Button>Show Dialog</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="cards" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>User Profile</CardTitle>
                <CardDescription>User information card example</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Jane Smith</p>
                    <p className="text-sm text-muted-foreground">jane.smith@example.com</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-sm text-muted-foreground">Administrator</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button size="sm" className="ml-auto">View Profile</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Feature Card</CardTitle>
                <CardDescription>Highlight key features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTitle>New Update Available</AlertTitle>
                  <AlertDescription>
                    A new software update is available for your application.
                  </AlertDescription>
                </Alert>
                <p>
                  This card demonstrates how to display important information or
                  features of your application.
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="ghost">Skip</Button>
                <Button>Update Now</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Stats Overview</CardTitle>
                <CardDescription>Monthly performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Total Users</p>
                    <p className="text-2xl font-bold">12.5k</p>
                    <Badge className="bg-success-light text-success-dark">+12.3%</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Revenue</p>
                    <p className="text-2xl font-bold">$45.2k</p>
                    <Badge className="bg-success-light text-success-dark">+8.1%</Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="ml-auto">View Report</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="forms" className="space-y-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Login Form</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button className="w-full">Sign In</Button>
              <Button variant="outline" className="w-full">Sign In with Google</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="colors" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ColorPaletteDemo />
            
            <Card>
              <CardHeader>
                <CardTitle>Text Colors</CardTitle>
                <CardDescription>Text styling with neutral colors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-neutral-950 dark:text-neutral-50">Text Neutral 950 / 50</p>
                <p className="text-neutral-900 dark:text-neutral-100">Text Neutral 900 / 100</p>
                <p className="text-neutral-800 dark:text-neutral-200">Text Neutral 800 / 200</p>
                <p className="text-neutral-700 dark:text-neutral-300">Text Neutral 700 / 300</p>
                <p className="text-neutral-600 dark:text-neutral-400">Text Neutral 600 / 400</p>
                <p className="text-neutral-500">Text Neutral 500</p>
                <p className="text-neutral-400 dark:text-neutral-600">Text Neutral 400 / 600</p>
                <p className="text-neutral-300 dark:text-neutral-700">Text Neutral 300 / 700</p>
                <p className="text-neutral-200 dark:text-neutral-800">Text Neutral 200 / 800</p>
                <p className="text-neutral-100 dark:text-neutral-900">Text Neutral 100 / 900</p>
                <p className="text-neutral-50 dark:text-neutral-950 bg-neutral-900 dark:bg-transparent">Text Neutral 50 / 950</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Border & Background</CardTitle>
                <CardDescription>Neutral colors for borders and backgrounds</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <div className="h-12 bg-neutral-50 border border-neutral-200 rounded-md p-3">
                    bg-neutral-50 (Background)
                  </div>
                  <div className="h-12 bg-neutral-100 border border-neutral-200 rounded-md p-3">
                    bg-neutral-100 (Card)
                  </div>
                  <div className="h-12 bg-neutral-200 rounded-md p-3">
                    bg-neutral-200 (Input, Border)
                  </div>
                  <div className="h-12 bg-neutral-300 rounded-md p-3 text-neutral-800">
                    bg-neutral-300
                  </div>
                  <div className="h-12 bg-neutral-800 rounded-md p-3 text-white">
                    bg-neutral-800 (Dark Mode Muted)
                  </div>
                  <div className="h-12 bg-neutral-900 rounded-md p-3 text-white">
                    bg-neutral-900 (Dark Mode Card)
                  </div>
                  <div className="h-12 bg-neutral-950 rounded-md p-3 text-white">
                    bg-neutral-950 (Dark Mode Background)
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 