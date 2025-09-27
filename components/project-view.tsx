"use client"


import { InfrastructureCanvas } from "@/components/infrastructure-canvas"
import { ProviderSelection } from "@/components/provider-selection"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MoreHorizontal, RefreshCw, Settings, Share } from "lucide-react"
import { useState } from "react"

interface Project {
  id: string
  name: string
  description?: string
  provider?: "aws" | "gcp" | "azure"
  architectures: number
  lastModified: string
  status: "active" | "archived"
  createdAt: string
}

interface ProjectViewProps {
  project: Project
  onBack: () => void
  onUpdateProject: (project: Project) => void
}

export function ProjectView({ project, onBack, onUpdateProject }: ProjectViewProps) {
  const [selectedProvider, setSelectedProvider] = useState<"aws" | "gcp" | "azure" | null>(project.provider || null)
  const [showCanvas, setShowCanvas] = useState(false)

  const handleProviderSelect = (provider: "aws" | "gcp" | "azure") => {
    setSelectedProvider(provider)

    // Update project with selected provider
    const updatedProject = {
      ...project,
      provider,
      lastModified: "Just now",
    }
    onUpdateProject(updatedProject)
    
    // Automatically go to canvas after provider selection
    setShowCanvas(true)
  }

  const handleProviderChange = () => {
    setSelectedProvider(null)
    setShowCanvas(false)

    // Update project to remove provider
    const updatedProject = {
      ...project,
      provider: undefined,
      lastModified: "Just now",
    }
    onUpdateProject(updatedProject)
  }

  const handleBackToProviderSelection = () => {
    setShowCanvas(false)
    setSelectedProvider(null)
    
    // Update project to remove provider
    const updatedProject = {
      ...project,
      provider: undefined,
      lastModified: "Just now",
    }
    onUpdateProject(updatedProject)
  }

  return (
    <div className="h-screen bg-background grid-pattern">
      {!showCanvas ? (
        <div className="h-full flex flex-col">
          {/* Project Header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm px-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-accent">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Projects
              </Button>
              <div className="h-4 w-px bg-border" />
              <div>
                <h1 className="text-lg font-semibold text-foreground">{project.name}</h1>
                {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
              </div>
              {selectedProvider && (
                <Badge variant="secondary" className="ml-2 bg-accent text-accent-foreground">
                  {selectedProvider.toUpperCase()}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedProvider && (
                <Button variant="ghost" size="sm" onClick={handleProviderChange} className="hover:bg-accent">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Change Provider
                </Button>
              )}
              <Button variant="ghost" size="sm" className="hover:bg-accent">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="ghost" size="sm" className="hover:bg-accent">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="ghost" size="sm" className="hover:bg-accent">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </header>

          {/* Project Content */}
          <main className="flex-1 p-6 bg-background/50">
            {!selectedProvider ? (
              <div className="max-w-4xl mx-auto">
                <ProviderSelection onProviderSelect={handleProviderSelect} />
              </div>
            ) : null}
          </main>
        </div>
      ) : (
        <InfrastructureCanvas
          provider={selectedProvider!}
          onBack={handleBackToProviderSelection}
        />
      )}
    </div>
  )
}
