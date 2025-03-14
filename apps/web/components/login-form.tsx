'use client'

/**
 * @file Login form component
 * @version 1.0.0
 *
 * A form component for user authentication with validation.
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import Link from "next/link"
import { LoginFormData, loginSchema } from '@/lib/validations/auth'
import { AuthService } from '@/lib/auth'

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
  // Initialize the form with react-hook-form and zod validation
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  /**
   * Handle form submission
   * @param data - Validated form data
   */
  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true)
      console.log(`Login: [${new Date().toISOString()}] Login attempt started`, { email: data.email })
      
      const result = await AuthService.login({
        email: data.email,
        password: data.password,
      })

      console.log(`Login: [${new Date().toISOString()}] Login attempt result`, { success: result.success })

      if (!result.success) {
        console.error("Login failed", { error: result.error })
        toast.error(result.error || 'Login failed')
        return
      }

      // Show success message and redirect
      console.log(`Login: [${new Date().toISOString()}] Login successful, preparing redirect to dashboard`)
      toast.success('Logged in successfully!')
      
      // Add a delay to ensure session is properly established before navigation
      console.log(`Login: [${new Date().toISOString()}] Waiting before navigation attempt...`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      try {
        console.log(`Login: [${new Date().toISOString()}] Pushing to dashboard route`)
        router.push('/dashboard')
        console.log(`Login: [${new Date().toISOString()}] Router.push to dashboard completed`)
        
        // Add a callback to check if navigation was successful
        setTimeout(() => {
          console.log(`Login: [${new Date().toISOString()}] Current pathname after navigation attempt:`, window.location.pathname)
        }, 1000)
      } catch (navigationError) {
        console.error("Navigation error", navigationError)
      }
    } catch (error) {
      console.error("Unexpected login error", error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-neutral-200 bg-white">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your Apple or Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
              <div className="flex flex-col gap-4">
                <Button variant="social" className="w-full" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Apple
                </Button>
                <Button variant="social" className="w-full" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Google
                </Button>
              </div>
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-neutral-200">
                <span className="relative z-10 bg-white px-2 text-neutral-500">
                  Or continue with
                </span>
              </div>
              <div className="grid gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormLabel htmlFor="email">Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          id="email"
                          type="email"
                          placeholder="m@example.com"
                          autoComplete="email"
                          disabled={isLoading}
                          className="border-neutral-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <div className="flex items-center">
                        <FormLabel htmlFor="password">Password</FormLabel>
                        <a
                          href="#"
                          className="ml-auto text-sm text-neutral-600 underline-offset-4 hover:underline"
                        >
                          Forgot your password?
                        </a>
                      </div>
                      <FormControl>
                        <Input
                          {...field}
                          id="password" 
                          type="password"
                          autoComplete="current-password"
                          disabled={isLoading}
                          className="border-neutral-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Spinner size="sm" className="text-white" />
                      Logging in...
                    </span>
                  ) : (
                    'Login'
                  )}
                </Button>
              </div>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-neutral-600 underline underline-offset-4 hover:text-neutral-800">
                  Sign up
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-neutral-500">
        By clicking continue, you agree to our{" "}
        <a href="#" className="text-neutral-600 underline underline-offset-4 hover:text-neutral-800">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="text-neutral-600 underline underline-offset-4 hover:text-neutral-800">
          Privacy Policy
        </a>
        .
      </div>
    </div>
  )
}
