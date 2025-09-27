"use client"

import { CreateProjectDialog } from "@/components/create-project-dialog"
import { ProjectView } from "@/components/project-view"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  Activity,
  Archive,
  Brain,
  Clock,
  Copy,
  Edit,
  ExternalLink,
  FileText,
  Filter,
  Folder,
  FolderOpen,
  Grid3X3,
  HelpCircle,
  Home,
  List,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Rocket,
  Search,
  Settings,
  Shield,
  Trash2,
} from "lucide-react"
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

const initialProjects: Project[] = [
  {
    id: "1",
    name: "E-commerce Platform",
    description: "Scalable microservices architecture",
    provider: "aws",
    architectures: 3,
    lastModified: "2 hours ago",
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Data Analytics Pipeline",
    description: "Real-time data processing system",
    provider: "gcp",
    architectures: 1,
    lastModified: "1 day ago",
    status: "active",
    createdAt: "2024-01-10",
  },
]

export function Dashboard() {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState("home")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const sidebarItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "projects", label: "Projects", icon: FolderOpen },
    { id: "templates", label: "Templates", icon: FileText },
    { id: "activity", label: "Activity", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  const filteredProjects = projects.filter(
    (project) => project.name.toLowerCase().includes(searchQuery.toLowerCase()) && project.status === "active",
  )

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project)
  }

  const handleBackToDashboard = () => {
    setSelectedProject(null)
  }

  const handleDeleteProject = (projectId: string) => {
    setProjects(projects.filter((p) => p.id !== projectId))
  }

  const handleArchiveProject = (projectId: string) => {
    setProjects(projects.map((p) => (p.id === projectId ? { ...p, status: "archived" as const } : p)))
  }

  const handleDuplicateProject = (project: Project) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      name: `${project.name} (Copy)`,
      createdAt: new Date().toISOString().split("T")[0],
      lastModified: "Just now",
      architectures: 0,
    }
    setProjects([newProject, ...projects])
  }

  const handleCreateProject = (projectData: Omit<Project, "id" | "lastModified" | "createdAt">) => {
    const newProject: Project = {
      ...projectData,
      id: Date.now().toString(),
      lastModified: "Just now",
      createdAt: new Date().toISOString().split("T")[0],
    }
    setProjects([newProject, ...projects])
    setSelectedProject(newProject)
  }

  if (selectedProject) {
    return (
      <ProjectView
        project={selectedProject}
        onBack={handleBackToDashboard}
        onUpdateProject={(updatedProject) => {
          setProjects(projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)))
          setSelectedProject(updatedProject)
        }}
      />
    )
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg text-gray-900">brainboard</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              MY ORGANIZATION
            </div>
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeTab === item.id
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Trial Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">Starter</span>
              <Badge className="bg-purple-100 text-purple-700 text-xs">✨ Trial</Badge>
            </div>
            <div className="text-xs text-gray-500">Free trial time period</div>
            <Progress value={96.7} className="h-2" />
            <div className="text-xs text-gray-500">Day 29 of 30</div>
          </div>
        </div>

        {/* Create Architecture Button */}
        <div className="p-4">
          <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
            <Pencil className="w-4 h-4 mr-2" />
            Create architecture
          </Button>
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-gray-900">Lalit Yadav</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Good evening, Lalit! 👋</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search or go to..."
                className="pl-10 w-80 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                ⌘ K
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <HelpCircle className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 bg-gray-50">
          {activeTab === "home" && (
            <div className="space-y-8">
              {/* Recent Architectures Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                      <Grid3X3 className="w-4 h-4 text-purple-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Recent architectures</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                      <Pencil className="w-4 h-4 mr-2" />
                      Create architecture
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-600">
                      <List className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-600">
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Architecture Grid Placeholder */}
                <div className="bg-white rounded-lg border border-gray-200 p-8">
                  <div className="grid grid-cols-8 gap-2 opacity-30">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div key={i} className="w-4 h-4 bg-gray-300 rounded-sm" />
                    ))}
                  </div>
                </div>
                
                {/* Architecture Item */}
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                    <Brain className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">nothing</div>
                    <div className="text-sm text-gray-500">Project 1</div>
                  </div>
                  <Badge className="bg-purple-100 text-purple-700 text-xs">Dev</Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    Edited 31 minutes ago
                  </div>
                </div>
              </div>

              {/* Recent Deployments Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                      <Rocket className="w-4 h-4 text-purple-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Recent deployments</h2>
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-600">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Empty Deployments State */}
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <div className="text-gray-400 text-sm">No recent deployments</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "projects" && (
            <div className="space-y-6">
              {/* Projects Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Folder className="w-5 h-5" />
                    <h2 className="text-lg font-semibold">Projects</h2>
                    <Badge variant="secondary">{filteredProjects.length}</Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <Card
                    key={project.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleProjectSelect(project)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{project.name}</CardTitle>
                          {project.description && (
                            <CardDescription className="mt-1">{project.description}</CardDescription>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleProjectSelect(project)
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Open Project
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDuplicateProject(project)
                              }}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleArchiveProject(project.id)
                              }}
                            >
                              <Archive className="w-4 h-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteProject(project.id)
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Architectures</span>
                          <span className="font-medium">{project.architectures}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Last modified</span>
                          <span className="font-medium">{project.lastModified}</span>
                        </div>
                        {project.provider && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Provider</span>
                            <Badge variant="outline" className="text-xs">
                              {project.provider.toUpperCase()}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Empty State */}
                {filteredProjects.length === 0 && (
                  <Card className="col-span-full">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Folder className="w-12 h-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                      <p className="text-muted-foreground text-center mb-4">
                        {searchQuery ? "Try adjusting your search terms" : "Create your first project to get started"}
                      </p>
                      <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Project
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Other tabs content */}
          {activeTab !== "projects" && (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} content coming soon...
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateProject={handleCreateProject}
      />
    </div>
  )
}
