import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export const metadata = {
  title: "Home | SaaS Application",
  description: "Welcome to our SaaS Application",
}

export default function HomePage() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-4xl font-bold tracking-tight">Welcome to Supa-SaaS</h1>
      <p className="text-xl text-muted-foreground">Your complete SaaS starter with Supabase and Next.js</p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Design System</CardTitle>
            <CardDescription>Explore our shadcn/ui components</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Check out our component library built with shadcn/ui featuring our custom theme.</p>
          </CardContent>
          <CardFooter>
            <Link href="/design-demo" className="w-full">
              <Button className="w-full">View Design Demo</Button>
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>User login and management</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Secure authentication powered by Supabase with a seamless login experience.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">Sign In</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Documentation and resources</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Find all the resources you need to get started with building your app.</p>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" className="w-full">Read Docs</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 