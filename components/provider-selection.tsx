"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaAws } from "react-icons/fa";
import { SiGooglecloud } from "react-icons/si";
import { VscAzure } from "react-icons/vsc";


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
      logo: FaAws,
      color: "#FF9900",
      available: true,
    },
    {
      id: "gcp" as const,
      name: "Google Cloud Platform",
      description: "Transform your business with Google's proven technology",
      logo: SiGooglecloud,
      color: "#4285F4",
      available: false,
    },
    {
      id: "azure" as const,
      name: "Microsoft Azure",
      description: "Invent with purpose on a trusted cloud platform",
      logo: VscAzure,
      color: "#0078D4",
      available: false,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Choose Your Cloud Provider</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Select the cloud platform you want to design your infrastructure for.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {providers.map((provider) => (
          <Card
            key={provider.id}
            className={`transition-shadow ${
              provider.available 
                ? "cursor-pointer hover:shadow-md" 
                : "cursor-not-allowed opacity-60"
            }`}
            onClick={() => provider.available && onProviderSelect(provider.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-3">
                    <provider.logo size={48} color={provider.color} />
                  </div>
                  <CardTitle className="text-base">{provider.name}</CardTitle>
                  <CardDescription className="mt-1">{provider.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                disabled={!provider.available}
              >
                {provider.available ? "Get Started" : "Coming Soon"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  )
}
