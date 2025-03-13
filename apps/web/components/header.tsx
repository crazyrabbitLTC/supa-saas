"use client"

import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-block font-bold">Supa-SaaS</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              href="/design-demo"
              className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Design System
            </Link>
            <Link
              href="#"
              className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#"
              className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Documentation
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <ModeToggle />
            <Button variant="outline" size="sm" className="hidden md:flex">
              Sign In
            </Button>
            <Button size="sm" className="hidden md:flex">
              Get Started
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
} 