"use client"

import { useState } from "react"
import { ReactFlowProvider } from "@xyflow/react"

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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  MoreHorizontal,
  Settings,
  Share,
  RefreshCw,
  Trash2,
} from "lucide-react"

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

// Simple wrapper - canvas now handles AI infrastructure directly
function InfrastructureCanvasWrapper({
  provider,
  onBack,
  projectId,
}: {
  provider: "aws" | "gcp" | "azure"
  onBack: () => void
  projectId: string
}) {
  console.log("🎨 InfrastructureCanvasWrapper: Rendering canvas with provider:", provider)
  return (
    <InfrastructureCanvas
      provider={provider}
      onBack={onBack}
      // If InfrastructureCanvas doesn't accept projectId, delete the next line.
      projectId={projectId}
    />
  )
}

export function ProjectView({
  project,
  onBack,
  onUpdateProject,
  onDeleteProject,
}: ProjectViewProps) {
  const [selectedProvider, setSelectedProvider] = useState<"aws" | "gcp" | "azure" | null>(project.provider || null)
  const [showCanvas, setShowCanvas] = useState(!!project.provider)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleProviderSelect = (provider: "aws" | "gcp" | "azure") => {
    setSelectedProvider(provider)
    onUpdateProject({
      ...project,
      provider,
      lastModified: "Just now",
    })
    setShowCanvas(true)
  }

  const handleProviderChange = () => {
    setSelectedProvider(null)
    setShowCanvas(false)
    onUpdateProject({
      ...project,
      provider: undefined,
      lastModified: "Just now",
    })
  }

  const handleBackToProviderSelection = () => {
    setShowCanvas(false)
    setSelectedProvider(null)
    onUpdateProject({
      ...project,
      provider: undefined,
      lastModified: "Just now",
    })
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
                {project.description && (
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                )}
              </div>
              {selectedProvider && (
                <Badge variant="secondary" className="ml-2 bg-accent text-accent-foreground">
                  {selectedProvider.toUpperCase()}
                </Badge>
              )}
            </div>

            {/* Three dots menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Project Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="w-4 h-4 mr-2" />
                  Share Project
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* Project Content */}
          <main className="flex-1 p-6 bg-background/50">
            {!selectedProvider ? (
              <div className="max-w-4xl mx-auto">
                <ProviderSelection onProviderSelect={handleProviderSelect} />
              </div>
            ) : (
              <div className="max-w-4xl mx-auto text-center py-8">
                <p className="text-muted-foreground">Loading infrastructure canvas...</p>
                <Button variant="ghost" size="sm" className="mt-4" onClick={handleProviderChange}>
                  Change provider
                </Button>
              </div>
            )}
          </main>
        </div>
      ) : (
        <>
          {console.log("🎨 ProjectView: Rendering canvas with provider:", selectedProvider)}
          <ReactFlowProvider>
            {selectedProvider && (
              <InfrastructureCanvasWrapper
                provider={selectedProvider}
                onBack={onBack}
                projectId={project.id}
              />
            )}
          </ReactFlowProvider>
        </>
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
