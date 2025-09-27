"use client"


import { InfrastructureCanvas } from "@/components/infrastructure-canvas"
import { ProviderSelection } from "@/components/provider-selection"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { ArrowLeft, MoreHorizontal, RefreshCw, Settings, Share, Trash2 } from "lucide-react"
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
  onDeleteProject: (projectId: string) => void
}

export function ProjectView({ project, onBack, onUpdateProject, onDeleteProject }: ProjectViewProps) {
  const [selectedProvider, setSelectedProvider] = useState<"aws" | "gcp" | "azure" | null>(project.provider || null)
  const [showCanvas, setShowCanvas] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleProviderSelect = (provider: "aws" | "gcp" | "azure") => {
    setSelectedProvider(provider)

    const updatedProject = {
      ...project,
      provider,
      lastModified: "Just now",
    }
    onUpdateProject(updatedProject)
    
    setShowCanvas(true)
  }

  const handleProviderChange = () => {
    setSelectedProvider(null)
    setShowCanvas(false)

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

  const handleDeleteProject = () => {
    onDeleteProject(project.id)
    onBack() 
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hover:bg-accent">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{project.name}"? This action cannot be undone.
              All project data and configurations will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
