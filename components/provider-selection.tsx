"use client"

import type { CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FaAws } from "react-icons/fa";
import { SiGooglecloud } from "react-icons/si";
import { VscAzure } from "react-icons/vsc";


type CloudProvider = "aws" | "gcp" | "azure"

interface ProviderSelectionProps {
  onProviderSelect: (provider: CloudProvider) => void
}

const lightenColor = (hex: string, amount: number) => {
  const sanitized = hex.replace("#", "");
  const num = parseInt(sanitized, 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0x00ff) + amount);
  const b = Math.min(255, (num & 0x0000ff) + amount);

  return `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
};

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
            style={
              provider.available
                ? ({ "--accent-color": provider.color } as CSSProperties)
                : undefined
            }
            className={`group relative overflow-hidden border border-border/60 transition-all duration-300 ${
              provider.available
                ? "cursor-pointer hover:-translate-y-1 hover:shadow-xl focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[var(--accent-color)]"
                : "cursor-not-allowed opacity-60"
            }`}
            onClick={() => provider.available && onProviderSelect(provider.id)}
          >
            {provider.available && (
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-1 translate-y-[-1px] rounded-b-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: `linear-gradient(90deg, ${provider.color}, ${lightenColor(provider.color, 45)})`,
                }}
              />
            )}
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
                variant={provider.available ? "default" : "outline"}
                className={`w-full transform transition-all duration-300 ${
                  provider.available
                    ? "border-0 text-white shadow-sm hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent-color)] active:translate-y-[1px] active:shadow-md"
                    : "border-dashed text-muted-foreground"
                }`}
                style={
                  provider.available
                    ? {
                        background: `linear-gradient(135deg, ${provider.color}, ${lightenColor(
                          provider.color,
                          45,
                        )})`,
                      }
                    : undefined
                }
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
