"use client"

import Link from "next/link"
import { Metadata } from "next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/providers/auth-provider"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { browserSupabase } from "@/lib/supabase-browser"

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  
  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "U";
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return "U";
  };
  
  // Load user metadata when user is available
  useEffect(() => {
    if (user?.user_metadata) {
      setFirstName(user.user_metadata.first_name || "");
      setLastName(user.user_metadata.last_name || "");
      setBio(user.user_metadata.bio || "");
      setTwitter(user.user_metadata.twitter || "");
      setGithub(user.user_metadata.github || "");
      setLinkedin(user.user_metadata.linkedin || "");
    }
  }, [user]);
  
  // Handle personal info update
  const handlePersonalInfoUpdate = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      const { error } = await browserSupabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
          bio: bio,
          full_name: `${firstName} ${lastName}`.trim(),
        }
      });
      
      if (error) throw error;
      
      // Update the user session to reflect the changes
      await browserSupabase.auth.refreshSession();
      
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("There was an error updating your profile");
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle social profiles update
  const handleSocialUpdate = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      const { error } = await browserSupabase.auth.updateUser({
        data: {
          twitter,
          github,
          linkedin,
        }
      });
      
      if (error) throw error;
      
      // Update the user session to reflect the changes
      await browserSupabase.auth.refreshSession();
      
      toast.success("Social profiles updated successfully");
    } catch (error) {
      console.error("Error updating social profiles:", error);
      toast.error("There was an error updating your social profiles");
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Get display name from user metadata
  const getDisplayName = () => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    
    if (user?.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    
    return "User";
  };
  
  // Last active display (placeholder for now)
  const getLastActive = () => {
    return "Just now";
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card text-card-foreground p-6">
        <div className="grid gap-6 md:grid-cols-[1fr_250px]">
          <div className="flex items-start gap-6">
            {isLoading ? (
              <div className="size-16 rounded-full bg-neutral-200 animate-pulse"></div>
            ) : (
              <Avatar className="size-16">
                <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder-user.svg"} alt="User" />
                <AvatarFallback className="text-xl text-neutral-900 bg-neutral-100">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="grid gap-1">
              <h1 className="text-2xl font-bold tracking-tight">
                {isLoading ? (
                  <div className="h-8 w-40 bg-neutral-200 rounded animate-pulse"></div>
                ) : (
                  getDisplayName()
                )}
              </h1>
              <p className="text-muted-foreground">
                {isLoading ? (
                  <div className="h-5 w-32 bg-neutral-200 rounded animate-pulse"></div>
                ) : (
                  user?.email
                )}
              </p>
              <div className="flex items-center gap-2 pt-2">
                <Badge variant="secondary">Free Plan</Badge>
                <div className="text-xs text-muted-foreground">
                  Last active: {getLastActive()}
                </div>
              </div>
            </div>
          </div>
          <div>
            <Button className="w-full" asChild>
              <Link href="/dashboard/settings/billing">Upgrade to Pro</Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal information and bio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="first-name">First name</Label>
              <Input 
                id="first-name" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last-name">Last name</Label>
              <Input 
                id="last-name" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Enter your bio"
                className="min-h-32"
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button 
              onClick={handlePersonalInfoUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? "Saving..." : "Save"}
            </Button>
          </CardFooter>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Social Profiles</CardTitle>
              <CardDescription>
                Link your social profiles to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="twitter">Twitter</Label>
                <Input 
                  id="twitter" 
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="@username" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="github">GitHub</Label>
                <Input 
                  id="github" 
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="username" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input 
                  id="linkedin" 
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="username" 
                />
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button 
                onClick={handleSocialUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save"}
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Update your password and manage 2FA.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="2fa">Two-factor authentication</Label>
                  <Switch id="2fa" />
                </div>
                <div className="text-xs text-muted-foreground">
                  Add an extra layer of security to your account.
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button>Update password</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
} 