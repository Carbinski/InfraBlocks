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
import { cn } from "@/lib/utils"
import {
  Archive,
  Brain,
  Copy,
  Edit,
  FileText,
  Folder,
  Home,
  MoreHorizontal,
  Plus,
  Settings,
  Shield,
  Trash2
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

const initialProjects: Project[] = []

export function Dashboard() {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState<string>("home")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const sidebarItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "templates", label: "Templates", icon: FileText },
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

  const handleTabChange = (tabId: string) => {
    if (sidebarItems.some(item => item.id === tabId)) {
      setActiveTab(tabId)
    }
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
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col relative z-10">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg text-gray-900">Infrablocks</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto relative" role="navigation" aria-label="Main navigation">
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              MY ORGANIZATION
            </div>
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={(e) => {
                  e.preventDefault()
                  handleTabChange(item.id)
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative z-20 cursor-pointer select-none",
                  activeTab === item.id
                    ? "bg-purple-100 text-purple-700 shadow-sm ring-1 ring-purple-200"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100",
                )}
                aria-pressed={activeTab === item.id}
                aria-label={`Navigate to ${item.label}`}
                aria-current={activeTab === item.id ? "page" : undefined}
                type="button"
                disabled={false}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

    


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
      <div className="flex-1 flex flex-col relative z-0">
        {/* Header */}
        <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Good evening, Lalit! 👋</h1>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
          {activeTab === "home" && (
            <div className="space-y-8">
              {/* Projects Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                      <Folder className="w-4 h-4 text-purple-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
                    <Badge variant="secondary">{filteredProjects.length}</Badge>
                  </div>
                  <Button 
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Add Project Card */}
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-white hover:border-purple-400 hover:bg-purple-100 hover:shadow-purple-100"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                        <Plus className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Create New Project</h3>
                      <p className="text-gray-600 text-center text-sm font-medium">
                        Start building your infrastructure
                      </p>
                    </CardContent>
                  </Card>

                  {filteredProjects.map((project) => (
                    <Card
                      key={project.id}
                      className="cursor-pointer hover:shadow-md transition-shadow bg-white"
                      onClick={() => handleProjectSelect(project)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base text-gray-900">{project.name}</CardTitle>
                            {project.description && (
                              <CardDescription className="mt-1 text-gray-600">{project.description}</CardDescription>
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
                            <span className="text-gray-600">Architectures</span>
                            <span className="font-medium text-gray-900">{project.architectures}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Last modified</span>
                            <span className="font-medium text-gray-900">{project.lastModified}</span>
                          </div>
                          {project.provider && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Provider</span>
                              <Badge variant="outline" className="text-xs text-gray-700 border-gray-300">
                                {project.provider.toUpperCase()}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6 max-w-4xl">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Cloud Provider Credentials</h2>
                <p className="text-sm text-gray-600">Configure your cloud provider credentials to deploy architectures.</p>
              </div>

              <div className="space-y-4">
                {/* AWS Credentials */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                        <span className="text-orange-600 font-bold text-xs">A</span>
                      </div>
                      AWS
                    </CardTitle>
                    <CardDescription>Amazon Web Services credentials</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Access Key ID</label>
                        <Input placeholder="AKIA..." className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Secret Access Key</label>
                        <Input type="password" placeholder="••••••••••••••••" className="mt-1" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Region</label>
                      <Input placeholder="us-east-1" className="mt-1" />
                    </div>
                    <Button className="w-full">Save AWS Credentials</Button>
                  </CardContent>
                </Card>

                {/* GCP Credentials */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-xs">G</span>
                      </div>
                      Google Cloud Platform
                    </CardTitle>
                    <CardDescription>Google Cloud Platform credentials</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Service Account Key</label>
                      <Input type="file" accept=".json" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Project ID</label>
                      <Input placeholder="my-gcp-project" className="mt-1" />
                    </div>
                    <Button className="w-full">Save GCP Credentials</Button>
                  </CardContent>
                </Card>

                {/* Azure Credentials */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-xs">A</span>
                      </div>
                      Microsoft Azure
                    </CardTitle>
                    <CardDescription>Microsoft Azure credentials</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Client ID</label>
                        <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Client Secret</label>
                        <Input type="password" placeholder="••••••••••••••••" className="mt-1" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tenant ID</label>
                      <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Subscription ID</label>
                      <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="mt-1" />
                    </div>
                    <Button className="w-full">Save Azure Credentials</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Templates tab content */}
          {activeTab === "templates" && (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Templates content coming soon...</p>
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
