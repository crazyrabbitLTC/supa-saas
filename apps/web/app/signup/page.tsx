import { GalleryVerticalEnd } from "lucide-react"
import { SignupForm } from "@/components/signup-form"

export const metadata = {
  title: "Sign Up | Supa-SaaS",
  description: "Create a new account",
}

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-6 bg-white p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-200 text-neutral-700">
            <GalleryVerticalEnd className="size-4" />
          </div>
          <span>Supa-SaaS</span>
        </div>
        <SignupForm />
      </div>
    </div>
  )
} 