'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/protected-route"

export default function ScrollTestPage() {
  // Generate an array of 20 items to create plenty of content
  const items = Array.from({ length: 20 }, (_, i) => i + 1)

  return (
    <ProtectedRoute>
      <div>
        <h1 className="text-3xl font-bold mb-6">Scroll Test</h1>
        <p className="text-muted-foreground mb-6">
          This page contains a lot of content to test that scrolling works properly in the dashboard.
        </p>
        
        <div className="grid gap-6">
          {items.map((item) => (
            <Card key={item}>
              <CardHeader>
                <CardTitle>Card {item}</CardTitle>
                <CardDescription>
                  This is a test card with index {item}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget
                  aliquam ultricies, quam sapien aliquet nunc, vitae aliquam nisl nunc eu nunc.
                  Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.
                </p>
                <p className="mb-4">
                  Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae;
                  Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula.
                  Proin eget tortor risus. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus.
                </p>
                <Button>Action {item}</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  )
} 