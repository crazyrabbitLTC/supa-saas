'use client'

/**
 * @file Settings page
 * @version 1.0.0
 * 
 * Settings page for users to manage their account
 */

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ProtectedRoute } from "@/components/protected-route"
import { useState } from "react"
import { toast } from "sonner"

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [securityAlerts, setSecurityAlerts] = useState(true)
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
  
  const handleDeleteAccount = () => {
    // Mock account deletion
    toast.success("Account deletion request submitted")
    setDeleteConfirmationOpen(false)
  }

  return (
    <ProtectedRoute>
      <div>
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                  <span>Email Notifications</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    Receive emails about your account activity.
                  </span>
                </Label>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="marketing-emails" className="flex flex-col space-y-1">
                  <span>Marketing Emails</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    Receive emails about new features and offers.
                  </span>
                </Label>
                <Switch
                  id="marketing-emails"
                  checked={marketingEmails}
                  onCheckedChange={setMarketingEmails}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="security-alerts" className="flex flex-col space-y-1">
                  <span>Security Alerts</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    Receive emails about your account security.
                  </span>
                </Label>
                <Switch
                  id="security-alerts"
                  checked={securityAlerts}
                  onCheckedChange={setSecurityAlerts}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Account Deletion</CardTitle>
              <CardDescription>
                Permanently delete your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteConfirmationOpen(true)}
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
} 