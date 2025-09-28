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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CredentialManager, type AWSCredentials, type AzureCredentials, type GCPCredentials } from "@/lib/credential-manager"
import { testCredentials } from "@/lib/api-service"
// Remove the separate persistence import - we'll use localStorage directly
import { cn } from "@/lib/utils"
import Image from "next/image"
import {
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
import { useEffect, useState } from "react"

interface Project {
  id: string
  name: string
  description?: string
  provider?: "aws" | "gcp" | "azure"
  architectures: number
  lastModified: string
  status: "active" | "archived"
  createdAt: string
  // Canvas state stored directly in project
  canvasState?: {
    nodes: any[]
    edges: any[]
    lastSaved: string
  }
}

export function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState<string>("home")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  
  // Credential states
  const [awsCredentials, setAwsCredentials] = useState<Partial<AWSCredentials>>({})
  const [gcpCredentials, setGcpCredentials] = useState<Partial<GCPCredentials>>({})
  const [azureCredentials, setAzureCredentials] = useState<Partial<AzureCredentials>>({})
  const [credentialErrors, setCredentialErrors] = useState<{[key: string]: string[]}>({})
  const [credentialStatus, setCredentialStatus] = useState<{[key: string]: 'idle' | 'saving' | 'testing' | 'success' | 'error'}>({
    aws: 'idle',
    gcp: 'idle', 
    azure: 'idle'
  })

  const sidebarItems = [
    { id: "home", label: "Home", icon: Home },
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
    const updatedProjects = projects.filter((p) => p.id !== projectId)
    setProjects(updatedProjects)
    localStorage.setItem('infrastructure-designer-projects', JSON.stringify(updatedProjects))
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
    
    const updatedProjects = [newProject, ...projects]
    setProjects(updatedProjects)
    localStorage.setItem('infrastructure-designer-projects', JSON.stringify(updatedProjects))
    setSelectedProject(newProject)
  }

  const handleTabChange = (tabId: string) => {
    if (sidebarItems.some(item => item.id === tabId)) {
      setActiveTab(tabId)
    }
  }

  // Load projects and credentials on component mount
  useEffect(() => {
    const loadProjects = () => {
      try {
        const savedProjects = localStorage.getItem('infrastructure-designer-projects')
        if (savedProjects) {
          const projects = JSON.parse(savedProjects)
          setProjects(projects)
          console.log(`Loaded ${projects.length} projects from storage`)
        }
      } catch (error) {
        console.error('Failed to load projects:', error)
      }
    }
    
    const loadCredentials = () => {
      const aws = CredentialManager.getCredentials('aws')
      const gcp = CredentialManager.getCredentials('gcp')
      const azure = CredentialManager.getCredentials('azure')
      
      if (aws) setAwsCredentials(aws)
      if (gcp) setGcpCredentials(gcp)
      if (azure) setAzureCredentials(azure)
    }
    
    loadProjects()
    loadCredentials()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId && !(event.target as Element).closest('[data-dropdown]')) {
        setOpenDropdownId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdownId])

  // AWS credential handlers
  const handleSaveAWSCredentials = async () => {
    setCredentialStatus(prev => ({ ...prev, aws: 'saving' }))
    
    try {
      const errors = CredentialManager.validateAWSCredentials(awsCredentials)
      if (errors.length > 0) {
        setCredentialErrors(prev => ({ ...prev, aws: errors }))
        setCredentialStatus(prev => ({ ...prev, aws: 'error' }))
        return
      }

      CredentialManager.saveCredentials('aws', awsCredentials)
      setCredentialErrors(prev => ({ ...prev, aws: [] }))
      setCredentialStatus(prev => ({ ...prev, aws: 'success' }))
      
      // Test credentials
      setCredentialStatus(prev => ({ ...prev, aws: 'testing' }))
      const testResult = await testCredentials('aws')
      
      if (testResult.valid) {
        setCredentialStatus(prev => ({ ...prev, aws: 'success' }))
      } else {
        setCredentialStatus(prev => ({ ...prev, aws: 'error' }))
        setCredentialErrors(prev => ({ ...prev, aws: [testResult.message] }))
      }
    } catch (error) {
      setCredentialStatus(prev => ({ ...prev, aws: 'error' }))
      setCredentialErrors(prev => ({ 
        ...prev, 
        aws: [error instanceof Error ? error.message : 'Failed to save credentials'] 
      }))
    }
  }

  // GCP credential handlers
  const handleSaveGCPCredentials = async () => {
    setCredentialStatus(prev => ({ ...prev, gcp: 'saving' }))
    
    try {
      const errors = CredentialManager.validateGCPCredentials(gcpCredentials)
      if (errors.length > 0) {
        setCredentialErrors(prev => ({ ...prev, gcp: errors }))
        setCredentialStatus(prev => ({ ...prev, gcp: 'error' }))
        return
      }

      CredentialManager.saveCredentials('gcp', gcpCredentials)
      setCredentialErrors(prev => ({ ...prev, gcp: [] }))
      setCredentialStatus(prev => ({ ...prev, gcp: 'success' }))
    } catch (error) {
      setCredentialStatus(prev => ({ ...prev, gcp: 'error' }))
      setCredentialErrors(prev => ({ 
        ...prev, 
        gcp: [error instanceof Error ? error.message : 'Failed to save credentials'] 
      }))
    }
  }

  // Azure credential handlers
  const handleSaveAzureCredentials = async () => {
    setCredentialStatus(prev => ({ ...prev, azure: 'saving' }))
    
    try {
      const errors = CredentialManager.validateAzureCredentials(azureCredentials)
      if (errors.length > 0) {
        setCredentialErrors(prev => ({ ...prev, azure: errors }))
        setCredentialStatus(prev => ({ ...prev, azure: 'error' }))
        return
      }

      CredentialManager.saveCredentials('azure', azureCredentials)
      setCredentialErrors(prev => ({ ...prev, azure: [] }))
      setCredentialStatus(prev => ({ ...prev, azure: 'success' }))
    } catch (error) {
      setCredentialStatus(prev => ({ ...prev, azure: 'error' }))
      setCredentialErrors(prev => ({ 
        ...prev, 
        azure: [error instanceof Error ? error.message : 'Failed to save credentials'] 
      }))
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
        onDeleteProject={(projectId) => setProjects(projects.filter((p) => p.id !== projectId))}
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
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center overflow-hidden">
              <Image
                src="/aws/icon.png"
                alt="InfraBlocks Logo"
                width={48}
                height={48}
                className="object-cover"
              />
            </div>
            <span className="font-semibold text-xl text-gray-900">InfraBlocks</span>
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

    

    </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-0">
        {/* Header */}
        <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
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
                       onClick={(e) => {
                         // Only handle card click if not clicking on dropdown
                         if (!(e.target as HTMLElement).closest('[data-radix-dropdown-menu-trigger]')) {
                           handleProjectSelect(project)
                         }
                       }}
                     >
                      <CardHeader className="pb-3">
                         <div className="flex items-start justify-between">
                           <div className="flex-1">
                             <CardTitle className="text-base text-gray-900">{project.name}</CardTitle>
                             {project.description && (
                               <CardDescription className="mt-1 text-gray-600">{project.description}</CardDescription>
                             )}
                           </div>
                           <div className="relative" data-dropdown>
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="hover:bg-gray-100"
                               onClick={(e) => {
                                 e.stopPropagation()
                                 setOpenDropdownId(openDropdownId === project.id ? null : project.id)
                                 console.log('Three dots clicked, dropdown:', openDropdownId === project.id ? 'closing' : 'opening')
                               }}
                             >
                               <MoreHorizontal className="w-4 h-4" />
                             </Button>
                             
                             {openDropdownId === project.id && (
                               <div className="absolute right-0 top-8 z-[100] min-w-[160px] bg-white border border-gray-200 shadow-lg rounded-md" data-dropdown>
                                 <div
                                   className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                                   onClick={(e) => {
                                     e.stopPropagation()
                                     console.log('Open project clicked')
                                     setOpenDropdownId(null)
                                     handleProjectSelect(project)
                                   }}
                                 >
                                   <Edit className="w-4 h-4 mr-2" />
                                   Open Project
                                 </div>
                                 <div
                                   className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                                   onClick={(e) => {
                                     e.stopPropagation()
                                     console.log('Duplicate clicked')
                                     setOpenDropdownId(null)
                                     handleDuplicateProject(project)
                                   }}
                                 >
                                   <Copy className="w-4 h-4 mr-2" />
                                   Duplicate
                                 </div>
                                 <div className="border-t border-gray-200 my-1"></div>
                                 <div
                                   className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer text-red-600"
                                   onClick={(e) => {
                                     e.stopPropagation()
                                     console.log('Delete clicked')
                                     setOpenDropdownId(null)
                                     handleDeleteProject(project.id)
                                   }}
                                 >
                                   <Trash2 className="w-4 h-4 mr-2" />
                                   Delete
                                 </div>
                               </div>
                             )}
                           </div>
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
                        <Input 
                          placeholder="AKIA..." 
                          className="mt-1" 
                          value={awsCredentials.accessKeyId || ''}
                          onChange={(e) => setAwsCredentials(prev => ({ ...prev, accessKeyId: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Secret Access Key</label>
                        <Input 
                          type="password" 
                          placeholder="••••••••••••••••" 
                          className="mt-1"
                          value={awsCredentials.secretAccessKey || ''}
                          onChange={(e) => setAwsCredentials(prev => ({ ...prev, secretAccessKey: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Region</label>
                      <Select 
                        value={awsCredentials.region || 'us-east-1'} 
                        onValueChange={(value) => setAwsCredentials(prev => ({ ...prev, region: value }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select a region" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us-east-1">US East (N. Virginia) - us-east-1</SelectItem>
                          <SelectItem value="us-east-2">US East (Ohio) - us-east-2</SelectItem>
                          <SelectItem value="us-west-1">US West (N. California) - us-west-1</SelectItem>
                          <SelectItem value="us-west-2">US West (Oregon) - us-west-2</SelectItem>
                          <SelectItem value="eu-west-1">Europe (Ireland) - eu-west-1</SelectItem>
                          <SelectItem value="eu-west-2">Europe (London) - eu-west-2</SelectItem>
                          <SelectItem value="eu-west-3">Europe (Paris) - eu-west-3</SelectItem>
                          <SelectItem value="eu-central-1">Europe (Frankfurt) - eu-central-1</SelectItem>
                          <SelectItem value="ap-southeast-1">Asia Pacific (Singapore) - ap-southeast-1</SelectItem>
                          <SelectItem value="ap-southeast-2">Asia Pacific (Sydney) - ap-southeast-2</SelectItem>
                          <SelectItem value="ap-northeast-1">Asia Pacific (Tokyo) - ap-northeast-1</SelectItem>
                          <SelectItem value="ap-northeast-2">Asia Pacific (Seoul) - ap-northeast-2</SelectItem>
                          <SelectItem value="ca-central-1">Canada (Central) - ca-central-1</SelectItem>
                          <SelectItem value="sa-east-1">South America (São Paulo) - sa-east-1</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Error messages */}
                    {credentialErrors.aws && credentialErrors.aws.length > 0 && (
                      <div className="text-sm text-red-600">
                        {credentialErrors.aws.map((error, index) => (
                          <div key={index}>• {error}</div>
                        ))}
                      </div>
                    )}
                    
                    {/* Success message */}
                    {credentialStatus.aws === 'success' && (
                      <div className="text-sm text-green-600">
                        ✓ AWS credentials saved and validated successfully!
                      </div>
                    )}
                    
                    <Button 
                      className="w-full" 
                      onClick={handleSaveAWSCredentials}
                      disabled={credentialStatus.aws === 'saving' || credentialStatus.aws === 'testing'}
                    >
                      {credentialStatus.aws === 'saving' && 'Saving...'}
                      {credentialStatus.aws === 'testing' && 'Testing credentials...'}
                      {credentialStatus.aws === 'success' && 'Credentials Saved'}
                      {credentialStatus.aws === 'error' && 'Save AWS Credentials'}
                      {(credentialStatus.aws === 'idle') && 'Save AWS Credentials'}
                    </Button>
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
