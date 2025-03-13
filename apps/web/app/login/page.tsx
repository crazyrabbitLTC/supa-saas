import { GalleryVerticalEnd } from "lucide-react"
import { LoginForm } from "@/components/login-form"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login | Supa-SaaS",
  description: "Sign in to your account",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-6 bg-white dark:bg-gray-950 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-200 dark:bg-gray-800 text-neutral-700 dark:text-gray-200">
            <GalleryVerticalEnd className="size-4" />
          </div>
          <span>Supa-SaaS</span>
        </div>
        <LoginForm />
      </div>
    </div>
  )
} 