"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type CloudProvider = "aws" | "gcp" | "azure"

interface ProviderSelectionProps {
  onProviderSelect: (provider: CloudProvider) => void
}

export function ProviderSelection({ onProviderSelect }: ProviderSelectionProps) {
  const providers = [
    {
      id: "aws" as const,
      name: "Amazon Web Services",
      description: "Build on the world's most comprehensive cloud platform",
      logo: "🟠", // AWS orange placeholder
    },
    {
      id: "gcp" as const,
      name: "Google Cloud Platform",
      description: "Transform your business with Google's proven technology",
      logo: "🔵", // GCP blue placeholder
    },
    {
      id: "azure" as const,
      name: "Microsoft Azure",
      description: "Invent with purpose on a trusted cloud platform",
      logo: "🔷", // Azure blue placeholder
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Choose Your Cloud Provider</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Select the cloud platform you want to design your infrastructure for. You can change this later if needed.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {providers.map((provider) => (
          <Card
            key={provider.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onProviderSelect(provider.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-4xl mb-3">{provider.logo}</div>
                  <CardTitle className="text-base">{provider.name}</CardTitle>
                  <CardDescription className="mt-1">{provider.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Get Started
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 p-6 bg-muted/30 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-center">Platform Features</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">50+</div>
            <div className="text-sm text-muted-foreground">Cloud Services</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">100%</div>
            <div className="text-sm text-muted-foreground">Terraform Compatible</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">5min</div>
            <div className="text-sm text-muted-foreground">Average Deploy Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">99.9%</div>
            <div className="text-sm text-muted-foreground">Uptime SLA</div>
          </div>
        </div>
      </div>
    </div>
  )
}
