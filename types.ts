import { type Edge, type Node } from "@xyflow/react"

// Cloud Service Node Types
export interface CloudServiceNodeData extends Record<string, unknown> {
  id: string
  name: string
  icon: string
  category: string
  description: string
  provider: string
  config?: Record<string, any>
  terraformType?: string
}

export interface CloudServiceNodeProps {
  onDoubleClick?: (nodeData: CloudServiceNodeData) => void
}

// Connection Edge Types
export interface ConnectionEdgeData extends Record<string, unknown> {
  relationship?: string
  description?: string
  bidirectional?: boolean
}

// Service Definition Types
export interface ServiceDefinition {
  id: string
  name: string
  icon: string
  category: string
  description: string
  terraformType: string
  defaultConfig: Record<string, any>
  configSchema: Record<string, ConfigField>
}

export interface ConfigField {
  type: "string" | "number" | "boolean" | "select" | "multiselect"
  label: string
  description?: string
  options?: string[]
  default?: any
  required?: boolean
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

// Configuration Panel Types
export interface ConfigurationPanelProps {
  isOpen: boolean
  onClose: () => void
  nodeData: {
    id: string
    name: string
    icon: string
    provider: string
    terraformType?: string
    config?: Record<string, any>
  } | null
  serviceConfig: any | null
  onConfigUpdate: (config: Record<string, any>) => void
  onSave?: () => void
}

// Infrastructure Canvas Types
export type CloudProvider = "aws" | "gcp" | "azure"

export interface InfrastructureCanvasProps {
  provider: CloudProvider
  onBack: () => void
}

// Node and Edge Type Definitions
export type CloudServiceNode = Node<CloudServiceNodeData>
export type ConnectionEdge = Edge<ConnectionEdgeData>
