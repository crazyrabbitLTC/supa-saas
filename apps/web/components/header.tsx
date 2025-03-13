"use client"

import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white">
      <div className="container mx-auto flex h-16 items-center">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-block font-bold">Supa-SaaS</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              href="/design-demo"
              className="flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900"
            >
              Design System
            </Link>
            <Link
              href="#"
              className="flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900"
            >
              Features
            </Link>
            <Link
              href="#"
              className="flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900"
            >
              Documentation
            </Link>
          </nav>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <nav className="flex items-center space-x-2">
            <ModeToggle />
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
          </nav>
        </div>
      </div>
    </header>
  )
} 