"use client"

import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import { AuthService } from "@/lib/auth"
import { useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function Header() {
  const { isAuthenticated, user, isLoading } = useAuth()
  const router = useRouter()
  
  // Log auth state when it changes
  useEffect(() => {
    console.log("Auth state in Header:", { isAuthenticated, isLoading, userEmail: user?.email })
  }, [isAuthenticated, isLoading, user])

  const handleLogout = useCallback(async () => {
    console.log("Logout initiated")
    await AuthService.logout()
    console.log("Logout completed, redirecting to home")
    router.push('/')
  }, [router])

  // This function handles dashboard navigation with direct URL for reliability
  const navigateToDashboard = useCallback((e: React.MouseEvent) => {
    e.preventDefault() // Prevent default link behavior
    console.log("Dashboard navigation triggered", { isAuthenticated, isLoading })
    
    if (isAuthenticated) {
      console.log("User is authenticated, navigating to dashboard using window.location")
      // Use direct window location with auth flag for more reliable navigation
      window.location.href = '/dashboard?auth=true'
    } else {
      console.log("Not authenticated, redirecting to login")
      window.location.href = '/login'
    }
  }, [isAuthenticated, isLoading])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white dark:bg-gray-950 dark:border-gray-800">
      <div className="container mx-auto flex h-16 items-center">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-block font-bold">Supa-SaaS</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              href="/design-demo"
              className="flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              Design System
            </Link>
            <Link
              href="#"
              className="flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              Features
            </Link>
            <Link
              href="#"
              className="flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              Documentation
            </Link>
            <a
              href="/dashboard"
              onClick={navigateToDashboard}
              className="flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white cursor-pointer"
            >
              Dashboard
            </a>
          </nav>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <nav className="flex items-center space-x-2">
            <ModeToggle />
            
            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-neutral-200 animate-pulse"></div>
            ) : isAuthenticated ? (
              <>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="mr-2"
                  onClick={(e) => {
                    e.preventDefault()
                    navigateToDashboard(e)
                  }}
                >
                  Go to Dashboard
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user?.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => navigateToDashboard(e as React.MouseEvent)}
                    >
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      console.log("Settings clicked, navigating");
                      window.location.href = '/dashboard/settings?auth=true';
                    }}>
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="cursor-pointer" 
                      onClick={handleLogout}
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm" className="hidden md:flex">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="hidden md:flex">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
} 