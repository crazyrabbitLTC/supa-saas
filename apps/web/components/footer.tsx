import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-neutral-500 md:text-left">
            &copy; {new Date().getFullYear()} Supa-SaaS. All rights reserved.
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="#"
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
          >
            Terms
          </Link>
          <Link
            href="#"
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
          >
            Privacy
          </Link>
          <Link
            href="#"
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  )
} 