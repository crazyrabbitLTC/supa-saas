'use client'

/**
 * @file Settings page
 * @version 1.0.0
 * 
 * A protected settings page for users to manage their account
 */

import { useState } from 'react'
import { ProtectedRoute } from '@/components/protected-route'
import { useAuth } from '@/components/providers/auth-provider'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AuthService } from '@/lib/auth'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { user } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUpdating(true)
    
    try {
      // In a real application, you would update the user's profile here
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      toast.success('Your profile has been updated successfully.')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUpdating(true)
    
    try {
      // In a real application, you would change the password here
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      toast.success('Your password has been changed successfully.')
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Failed to change password. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your account profile information and email address.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleUpdateProfile}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      placeholder="Enter your email"
                      defaultValue={user?.email || ''}
                      disabled
                    />
                    <p className="text-sm text-muted-foreground">
                      Your email address is used for signing in and cannot be changed.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      defaultValue={user?.user_metadata?.full_name || ''}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to ensure your account remains secure.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleChangePassword}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Current Password</Label>
                    <Input
                      id="current_password"
                      type="password"
                      placeholder="Enter your current password"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      placeholder="Enter your new password"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      placeholder="Confirm your new password"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? 'Updating...' : 'Change Password'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
} 