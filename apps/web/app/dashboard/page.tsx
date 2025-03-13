'use client'

/**
 * @file Dashboard page
 * @version 1.0.0
 * 
 * A protected dashboard page that requires authentication
 */

import { ProtectedRoute } from '@/components/protected-route'
import { useAuth } from '@/components/providers/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Welcome, {user?.email}</CardTitle>
              <CardDescription>
                This is your personal dashboard, a protected area that requires authentication.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                You are now logged in to the application. This page is only accessible to authenticated users.
              </p>
              <Button asChild>
                <Link href="/settings">Manage Your Account</Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Some helpful resources to get you started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                <li>Update your profile information</li>
                <li>Explore the application features</li>
                <li>Configure your preferences</li>
                <li>Invite team members</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
} 