"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { InfrastructureCanvasProps } from "@/types"
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type OnConnect,
  type ReactFlowInstance,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import {
  ArrowLeft,
  Code,
  Download,
  Pin,
  Play,
  Brain
} from "lucide-react"
import GlassyPaneContainer from '@/src/cedar/components/containers/GlassyPaneContainer'
import { useCallback, useEffect, useRef, useState, type DragEvent } from "react"
import { CloudServiceNode } from "./cloud-service-node"
import { ConfigurationPanel } from "./configuration-panel"
import { getConnectionSuggestions, validateConnection } from "./connection-validator"
import { serviceDefinitions } from "./service-definitions"
import { AIReviewDialog } from "./ai-review-dialog"


const createNodeTypes = (onNodeDoubleClick: (nodeData: any) => void) => ({
  cloudService: (props: any) => <CloudServiceNode {...props} onDoubleClick={onNodeDoubleClick} />,
})

const createEdgeTypes = () => {
  console.log('Creating edge types - using default edges for now')
  return {
    // Temporarily removing custom edge to test
    // custom: ConnectionEdge,
  }
}

// Use smoothstep edge type for testing
const defaultEdgeOptions = {
  style: { strokeWidth: 3, stroke: '#ef4444' },
  type: 'smoothstep',
  animated: false,
}

let nodeId = 0
const getId = () => `node_${nodeId++}`

export function InfrastructureCanvas({ provider, onBack }: InfrastructureCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([])

  // Debug: Log edges changes
  useEffect(() => {
    console.log('Edges updated:', edges)
    console.log('Edges length:', edges.length)
    if (edges.length > 0) {
      console.log('First edge details:', edges[0])
    }
  }, [edges])

  // Debug: Log nodes changes
  useEffect(() => {
    console.log('Nodes updated:', nodes)
    console.log('Nodes length:', nodes.length)
  }, [nodes])
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false)
  const [selectedNodes, setSelectedNodes] = useState<string[]>([])
  const [selectedEdges, setSelectedEdges] = useState<string[]>([])
  const [activeFile, setActiveFile] = useState("main.tf")
  const [terraformFiles, setTerraformFiles] = useState({
    "main.tf": "",
    "variables.tf": "",
    "outputs.tf": "",
    "providers.tf": ""
  })
  const [isAIReviewOpen, setIsAIReviewOpen] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [isAIReviewLoading, setIsAIReviewLoading] = useState(false)
  const [aiReviewError, setAiReviewError] = useState<string | null>(null)
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
    (params: Connection | Edge) => {
      console.log('onConnect called with params:', params)
      
      const sourceNode = nodes.find((n) => n.id === params.source)
      const targetNode = nodes.find((n) => n.id === params.target)

      if (!sourceNode || !targetNode) {
        console.log('Source or target node not found')
        return
      }

      const sourceType = (sourceNode.data as any).id
      const targetType = (targetNode.data as any).id

      console.log('Connecting:', sourceType, 'to', targetType)

      // Validate the connection
      const rule = validateConnection(sourceType, targetType, provider)
      
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: false,
        style: { strokeWidth: 4, stroke: '#10b981' }, // Green color
        data: {
          relationship: rule?.relationship || "connects_to",
          description: rule?.description || "Manual connection",
          bidirectional: rule?.bidirectional || false,
        },
      }
      
      console.log('Creating new edge:', newEdge)
      
      setEdges((eds) => {
        const updatedEdges = addEdge(newEdge, eds)
        console.log('Updated edges:', updatedEdges)
        return updatedEdges
      })
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

      const serviceData = event.dataTransfer.getData("application/reactflow")

      if (!serviceData) return

      const service = JSON.parse(serviceData)
      
      // Get the mouse position relative to the ReactFlow wrapper
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      const mouseX = event.clientX - reactFlowBounds.left
      const mouseY = event.clientY - reactFlowBounds.top
      
      const position = reactFlowInstance.screenToFlowPosition({
        x: mouseX,
        y: mouseY,
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

  const deleteSelectedElements = useCallback(() => {
    if (selectedNodes.length > 0) {
      setNodes((nds) => nds.filter((node) => !selectedNodes.includes(node.id)))
      setSelectedNodes([])
    }
    
    if (selectedEdges.length > 0) {
      setEdges((eds) => eds.filter((edge) => !selectedEdges.includes(edge.id)))
      setSelectedEdges([])
    }
  }, [selectedNodes, selectedEdges])

  const handleSelectionChange = useCallback(({ nodes: selectedNodesArray, edges: selectedEdgesArray }: { nodes: any[], edges: any[] }) => {
    setSelectedNodes(selectedNodesArray.map(node => node.id))
    setSelectedEdges(selectedEdgesArray.map(edge => edge.id))
  }, [])

  // Test function to manually create a connection
  const testConnection = () => {
    if (nodes.length >= 2) {
      const testEdge = {
        id: `test-${Date.now()}`,
        source: nodes[0].id,
        target: nodes[1].id,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#ff0000', strokeWidth: 5 },
        data: {
          relationship: "test_connection",
          description: "Test connection",
          bidirectional: false,
        },
      }
      console.log('Creating test connection:', testEdge)
      console.log('Current nodes:', nodes)
      console.log('Current edges before:', edges)
      setEdges((eds) => {
        const newEdges = addEdge(testEdge, eds)
        console.log('New edges after adding:', newEdges)
        return newEdges
      })
    }
  }

  const suggestions = getConnectionSuggestions(nodes, provider!)

  const handleNodeDoubleClick = (nodeData: any) => {
    setSelectedNode(nodeData)
    setIsConfigPanelOpen(true)
  }

  const handleConfigUpdate = (config: Record<string, any>) => {
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNode.id
            ? { ...node, data: { ...node.data, config } }
            : node
        )
      )
    }
  }

  const handleCloseConfigPanel = () => {
    setIsConfigPanelOpen(false)
    setSelectedNode(null)
  }

  const handleAIReview = async () => {
    setIsAIReviewOpen(true)
    setIsAIReviewLoading(true)
    setAiReviewError(null)
    setAiAnalysis(null)

    try {
      const response = await fetch('/api/ai-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          terraformFiles,
          provider,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const analysis = await response.json()
      setAiAnalysis(analysis)
    } catch (error) {
      console.error('AI Review Error:', error)
      setAiReviewError(error instanceof Error ? error.message : 'Failed to analyze infrastructure')
    } finally {
      setIsAIReviewLoading(false)
    }
  }

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

  // Initialize Terraform files with default content
  const initializeTerraformFiles = () => {
    const mainTf = generateTerraformCode()
    const variablesTf = `# Variables for your infrastructure
variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}
`

    const outputsTf = `# Outputs for your infrastructure
output "resources_created" {
  description = "Number of resources created"
  value       = ${nodes.length}
}
`

    const providersTf = `# Provider configuration
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}
`

    setTerraformFiles({
      "main.tf": mainTf,
      "variables.tf": variablesTf,
      "outputs.tf": outputsTf,
      "providers.tf": providersTf
    })
  }

  // Handle file content changes
  const handleFileContentChange = (content: string) => {
    setTerraformFiles(prev => ({
      ...prev,
      [activeFile]: content
    }))
  }

  // Handle file switching
  const handleFileChange = (fileName: string) => {
    setActiveFile(fileName)
  }

  // Update main.tf when nodes change
  const updateMainTf = () => {
    const newMainTf = generateTerraformCode()
    setTerraformFiles(prev => ({
      ...prev,
      "main.tf": newMainTf
    }))
  }

  // Initialize files on component mount
  useEffect(() => {
    initializeTerraformFiles()
  }, [])

  // Update main.tf when nodes change
  useEffect(() => {
    updateMainTf()
  }, [nodes])

  // Handle keyboard events for delete functionality
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        deleteSelectedElements()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [deleteSelectedElements])

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
              <span className="text-gray-900 text-xs font-bold">A</span>
            </div>
            <span className="text-sm font-medium text-gray-600">aws</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <aside className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-4 space-y-4">
            
            {/* Cloud Services */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">Cloud Services</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {services.slice(0, 12).map((service) => (
                  <div
                    key={service.id}
                    className="flex flex-col items-center p-2 hover:bg-purple-50 rounded cursor-grab active:cursor-grabbing border border-gray-200 hover:border-purple-200 transition-colors"
                    draggable
                    onDragStart={(event) => onDragStart(event, service)}
                  >
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm mb-1">
                      {service.icon.startsWith('/') ? (
                        <img src={service.icon} alt={service.name} className="w-6 h-6" />
                      ) : (
                        <span className="text-lg">{service.icon}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-700 text-center leading-tight">{service.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Node Count and Test Button */}
            <div className="mt-auto pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-2">
                Number of nodes: {nodes.length}
              </div>
              <div className="text-xs text-gray-500 mb-2">
                Number of edges: {edges.length}
              </div>
              {(selectedNodes.length > 0 || selectedEdges.length > 0) && (
                <div className="mb-2">
                  <div className="text-xs text-red-600 mb-1">
                    Selected: {selectedNodes.length} node{selectedNodes.length !== 1 ? 's' : ''}, {selectedEdges.length} edge{selectedEdges.length !== 1 ? 's' : ''}
                  </div>
                  <Button 
                    onClick={deleteSelectedElements}
                    size="sm"
                    variant="destructive"
                    className="w-full text-xs"
                  >
                    Delete Selected
                  </Button>
                </div>
              )}
              {nodes.length >= 2 && (
                <Button 
                  onClick={testConnection}
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                >
                  Test Connection
                </Button>
              )}
            </div>
          </div>
        </aside>

        {/* Central Canvas */}
        <main className="flex-1 flex flex-col">

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
                  onInit={(instance) => {
                    console.log('ReactFlow initialized:', instance)
                    setReactFlowInstance(instance as any)
                  }}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onSelectionChange={handleSelectionChange}
                  nodeTypes={createNodeTypes(handleNodeDoubleClick)}
                  // edgeTypes={createEdgeTypes()}
                  className="bg-gray-50"
                  connectionLineStyle={{ stroke: "#666", strokeWidth: 2 }}
                  defaultEdgeOptions={defaultEdgeOptions}
                  snapToGrid={true}
                  snapGrid={[20, 20]}
                  panOnDrag={true}
                  panOnScroll={false}
                  panOnScrollSpeed={0}
                  selectNodesOnDrag={false}
                  nodesDraggable={true}
                  nodesConnectable={true}
                  elementsSelectable={true}
                  elevateNodesOnSelect={false}
                  autoPanOnNodeDrag={false}
                  zoomOnScroll={true}
                  minZoom={0.1}
                  maxZoom={4}
                >
                  <Background 
                    variant={BackgroundVariant.Dots} 
                    gap={20} 
                    size={2} 
                    color="#9ca3af"
                    style={{ backgroundColor: '#f9fafb' }}
                  />
                  <Controls />
                </ReactFlow>
              </ReactFlowProvider>
            </div>
            
            {/* AI Review Button - Bottom Right */}
            <div className="absolute bottom-4 right-4 pointer-events-none z-10">
              <div className="pointer-events-auto">
                <GlassyPaneContainer
                  className="cursor-pointer hover:scale-105 transition-transform duration-200"
                  onClick={handleAIReview}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <button className="px-6 py-3 flex items-center gap-2 text-sm font-medium text-gray-800 hover:text-gray-900">
                    <Brain className="w-5 h-5" />
                    AI Review
                  </button>
                </GlassyPaneContainer>
              </div>
            </div>
          </div>
        </main>

        {/* Right Panel - Configuration or Code Editor */}
        {isConfigPanelOpen ? (
          <ConfigurationPanel
            isOpen={isConfigPanelOpen}
            onClose={handleCloseConfigPanel}
            nodeData={selectedNode}
            serviceConfig={null} // This will be loaded by the configuration panel
            onConfigUpdate={handleConfigUpdate}
          />
        ) : (
          <aside className="w-80 border-l border-gray-200 bg-gray-50 text-gray-900">
            <div className="h-full flex flex-col">
              {/* Code Editor Header */}
              <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  <Select value={activeFile} onValueChange={handleFileChange}>
                    <SelectTrigger className="w-44 bg-gray-100 border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-100 border-gray-300">
                      <SelectItem value="main.tf" className="text-gray-900 hover:bg-gray-200">main.tf</SelectItem>
                      <SelectItem value="variables.tf" className="text-gray-900 hover:bg-gray-200">variables.tf</SelectItem>
                      <SelectItem value="outputs.tf" className="text-gray-900 hover:bg-gray-200">outputs.tf</SelectItem>
                      <SelectItem value="providers.tf" className="text-gray-900 hover:bg-gray-200">providers.tf</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Code Content */}
              <div className="flex-1 overflow-auto p-4 bg-gray-50">
                <textarea
                  value={terraformFiles[activeFile as keyof typeof terraformFiles]}
                  onChange={(e) => handleFileContentChange(e.target.value)}
                  className="terraform-editor w-full h-full bg-gray-50 text-sm text-gray-900 resize-none border-none outline-none"
                  placeholder="Start typing your Terraform configuration..."
                  spellCheck={false}
                />
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* AI Review Dialog */}
      <AIReviewDialog
        isOpen={isAIReviewOpen}
        onClose={() => setIsAIReviewOpen(false)}
        analysis={aiAnalysis}
        isLoading={isAIReviewLoading}
        error={aiReviewError}
      />
    </div>
  )
}
