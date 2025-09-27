"use client"

type CloudProvider = "aws" | "gcp" | "azure"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Node,
  type OnConnect,
  type ReactFlowInstance,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import {
  ArrowLeft,
  Brain,
  ChevronDown,
  Code,
  Diamond,
  Download,
  FileText,
  Grid3X3,
  History,
  Image,
  Import,
  Layers,
  Maximize2,
  Pencil,
  Pin,
  Play,
  Redo,
  Search,
  Shapes,
  Square,
  Undo,
  Users,
  ZoomIn,
  ZoomOut
} from "lucide-react"
import { useCallback, useRef, useState, type DragEvent } from "react"
import { CloudServiceNode } from "./cloud-service-node"
import { ConnectionEdge } from "./connection-edge"
import { getConnectionSuggestions, validateConnection } from "./connection-validator"
import { serviceDefinitions } from "./service-definitions"

interface InfrastructureCanvasProps {
  provider: CloudProvider
  onBack: () => void
}

const nodeTypes = {
  cloudService: CloudServiceNode,
}

const edgeTypes = {
  connection: ConnectionEdge,
}

let nodeId = 0
const getId = () => `node_${nodeId++}`

export function InfrastructureCanvas({ provider, onBack }: InfrastructureCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([])
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const providerConfig = {
    aws: {
      name: "AWS",
      color: "text-orange-500",
    },
    gcp: {
      name: "Google Cloud",
      color: "text-blue-500",
    },
    azure: {
      name: "Microsoft Azure",
      color: "text-cyan-500",
    },
  }

  const config = providerConfig[provider as keyof typeof providerConfig]
  const services = Object.values(serviceDefinitions[provider] || {})
  const categories = [...new Set(services.map((s) => s.category))]

  const onConnect: OnConnect = useCallback(
    (connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source)
      const targetNode = nodes.find((n) => n.id === connection.target)

      if (!sourceNode || !targetNode) return

      const sourceType = (sourceNode.data as any).id
      const targetType = (targetNode.data as any).id

      // Validate the connection
      const rule = validateConnection(sourceType, targetType, provider)

      if (rule) {
        const newEdge = {
          ...connection,
          type: "connection",
          data: {
            relationship: rule.relationship,
            description: rule.description,
            bidirectional: rule.bidirectional,
          },
        }
        setEdges((eds) => addEdge(newEdge, eds))
      } else {
        // Show warning or prevent invalid connection
        console.warn(`Invalid connection between ${sourceType} and ${targetType}`)
      }
    },
    [nodes, setEdges, provider],
  )

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()

      if (!reactFlowWrapper.current || !reactFlowInstance) return

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      const serviceData = event.dataTransfer.getData("application/reactflow")

      if (!serviceData) return

      const service = JSON.parse(serviceData)
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const newNode: Node = {
        id: getId(),
        type: "cloudService",
        position,
        data: {
          ...service,
          provider: provider,
          config: service.defaultConfig || {},
          terraformType: service.terraformType,
        },
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [reactFlowInstance, setNodes, provider],
  )

  const onDragStart = (event: DragEvent, service: any) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify(service))
    event.dataTransfer.effectAllowed = "move"
  }

  const clearCanvas = () => {
    setNodes([])
    setEdges([])
  }

  const suggestions = getConnectionSuggestions(nodes, provider!)

  // Generate Terraform code from nodes
  const generateTerraformCode = () => {
    if (nodes.length === 0) {
      return `# No resources defined yet
# Drag and drop services from the sidebar to generate Terraform code`
    }

    let terraformCode = `# Generated Terraform configuration\n\n`
    
    nodes.forEach((node) => {
      const service = node.data as any
      terraformCode += `resource "${service.terraformType}" "${service.id}" {\n`
      
      // Add basic configuration
      if (service.config) {
        Object.entries(service.config).forEach(([key, value]) => {
          if (value) {
            terraformCode += `  ${key} = "${value}"\n`
          }
        })
      }
      
      terraformCode += `}\n\n`
    })
    
    return terraformCode
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Top Header */}
      <header className="h-12 border-b border-gray-200 bg-white flex items-center px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span className="text-sm font-medium text-gray-600">aws</span>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm font-medium text-gray-600">5.100.0</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <aside className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Provider and Version */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 rounded-lg">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-sm font-medium">aws</span>
                <ChevronDown className="w-3 h-3" />
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <span className="text-sm font-medium">5.100.0</span>
                <ChevronDown className="w-3 h-3" />
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center">
                  <img src="/Arch_AWS-EC2_64.svg" alt="EC2" className="w-3 h-3" />
                </div>
                <div className="w-6 h-6 bg-gray-300 rounded flex items-center justify-center">
                  <img src="/Arch_AWS-Lambda_64.svg" alt="Lambda" className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search TF resources" 
                className="pl-10 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            {/* TF Resources Tabs */}
            <Tabs defaultValue="variables" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                <TabsTrigger value="variables" className="data-[state=active]:bg-white data-[state=active]:text-purple-600">Variables</TabsTrigger>
                <TabsTrigger value="locals" className="data-[state=active]:bg-white data-[state=active]:text-purple-600">Locals</TabsTrigger>
                <TabsTrigger value="outputs" className="data-[state=active]:bg-white data-[state=active]:text-purple-600">Outputs</TabsTrigger>
              </TabsList>
              <TabsContent value="variables" className="mt-2">
                <div className="text-sm text-gray-500">No variables defined</div>
              </TabsContent>
              <TabsContent value="locals" className="mt-2">
                <div className="text-sm text-gray-500">No locals defined</div>
              </TabsContent>
              <TabsContent value="outputs" className="mt-2">
                <div className="text-sm text-gray-500">No outputs defined</div>
              </TabsContent>
            </Tabs>

            {/* Modules */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Diamond className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-gray-900">Modules</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50">
                  <Import className="w-3 h-3 mr-1" />
                  Import
                </Button>
                <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                  <Grid3X3 className="w-3 h-3 mr-1" />
                  Catalog
                </Button>
              </div>
            </div>

            {/* Design */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-gray-900">Design</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" className="aspect-square p-0 border-gray-200 hover:bg-purple-50 hover:border-purple-200">
                  <Image className="w-4 h-4 text-purple-600" />
                </Button>
                <Button variant="outline" size="sm" className="aspect-square p-0 border-gray-200 hover:bg-purple-50 hover:border-purple-200">
                  <Square className="w-4 h-4 text-purple-600" />
                </Button>
                <Button variant="outline" size="sm" className="aspect-square p-0 border-gray-200 hover:bg-purple-50 hover:border-purple-200">
                  <Layers className="w-4 h-4 text-purple-600" />
                </Button>
                <Button variant="outline" size="sm" className="aspect-square p-0 border-gray-200 hover:bg-purple-50 hover:border-purple-200">
                  <Brain className="w-4 h-4 text-purple-600" />
                </Button>
                <Button variant="outline" size="sm" className="aspect-square p-0 border-gray-200 hover:bg-purple-50 hover:border-purple-200">
                  <Shapes className="w-4 h-4 text-purple-600" />
                </Button>
                <Button variant="outline" size="sm" className="aspect-square p-0 border-gray-200 hover:bg-purple-50 hover:border-purple-200">
                  <Shapes className="w-4 h-4 text-purple-600" />
                </Button>
              </div>
            </div>

            {/* Containers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">Containers</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 p-2 hover:bg-purple-50 rounded">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="w-3 h-3 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-700">Availability Zone</span>
                </div>
              </div>
            </div>

            {/* Cloud Services */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">Cloud Services</span>
                </div>
              </div>
              <div className="space-y-2">
                {services.slice(0, 6).map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center gap-2 p-2 hover:bg-purple-50 rounded cursor-grab active:cursor-grabbing border border-gray-200 hover:border-purple-200"
                    draggable
                    onDragStart={(event) => onDragStart(event, service)}
                  >
                    <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center text-white text-xs font-bold">
                      {service.icon.startsWith('/') ? (
                        <img src={service.icon} alt={service.name} className="w-4 h-4" />
                      ) : (
                        service.icon
                      )}
                    </div>
                    <span className="text-sm text-gray-700">{service.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Node Count */}
            <div className="mt-auto pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                Number of nodes: {nodes.length}
              </div>
            </div>
          </div>
        </aside>

        {/* Central Canvas */}
        <main className="flex-1 flex flex-col">
          {/* Canvas Toolbar */}
          <div className="h-12 border-b border-gray-200 bg-white flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Maximize2 className="w-4 h-4" />
              </Button>
              <div className="w-px h-6 bg-gray-200 mx-2" />
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Undo className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Redo className="w-4 h-4" />
              </Button>
              <div className="w-px h-6 bg-gray-200 mx-2" />
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <History className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <FileText className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 relative bg-gray-50">
            <div ref={reactFlowWrapper} className="h-full">
              <ReactFlowProvider>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onInit={setReactFlowInstance}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  fitView
                  className="bg-gray-50"
                  connectionLineStyle={{ stroke: "#666", strokeWidth: 2 }}
                  defaultEdgeOptions={{ type: "connection" }}
                >
                  <Background 
                    variant={BackgroundVariant.Dots} 
                    gap={20} 
                    size={1} 
                    color="#d1d5db"
                    style={{ backgroundColor: '#f9fafb' }}
                  />
                  <Controls className="bg-white border border-gray-200 shadow-sm" />
                </ReactFlow>
              </ReactFlowProvider>
            </div>

            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎨</div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Start Building</h3>
                  <p className="text-gray-500 max-w-md text-pretty">
                    Drag and drop cloud services from the sidebar to start designing your infrastructure.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Code Editor Panel */}
        <aside className="w-80 border-l border-gray-200 bg-gray-900 text-white">
          <div className="h-full flex flex-col">
            {/* Code Editor Header */}
            <div className="h-12 border-b border-gray-700 flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span className="text-sm font-medium">main.tf</span>
                <ChevronDown className="w-3 h-3" />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <Pin className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <Play className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-sm font-mono leading-relaxed">
                <code>{generateTerraformCode()}</code>
              </pre>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
