"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ColorPaletteDemo() {
  const neutralColors = [
    { name: 'neutral-50', description: 'Lightest - Background', className: 'bg-neutral-50' },
    { name: 'neutral-100', description: 'Cards, Muted', className: 'bg-neutral-100' },
    { name: 'neutral-200', description: 'Borders, Inputs', className: 'bg-neutral-200' },
    { name: 'neutral-300', description: 'Light Dividers', className: 'bg-neutral-300' },
    { name: 'neutral-400', description: 'Muted Foreground', className: 'bg-neutral-400' },
    { name: 'neutral-500', description: 'Muted Text', className: 'bg-neutral-500' },
    { name: 'neutral-600', description: 'Secondary Text', className: 'bg-neutral-600' },
    { name: 'neutral-700', description: 'Dark Secondary Text', className: 'bg-neutral-700' },
    { name: 'neutral-800', description: 'Dark Mode Muted', className: 'bg-neutral-800' },
    { name: 'neutral-900', description: 'Text, Dark Mode Cards', className: 'bg-neutral-900' },
    { name: 'neutral-950', description: 'Darkest - Dark Mode Background', className: 'bg-neutral-950' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neutral Color Palette</CardTitle>
        <CardDescription>
          The neutral color scale used throughout the application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {neutralColors.map((color) => (
            <div key={color.name} className="flex items-center gap-3">
              <div 
                className={`h-12 w-12 rounded-md ${color.className} border border-neutral-300 dark:border-neutral-700`} 
                aria-label={color.name}
              />
              <div>
                <p className="font-medium">{color.name}</p>
                <p className="text-sm text-muted-foreground">{color.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 