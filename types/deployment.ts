import type { Edge, Node } from '@xyflow/react'

export interface DeploymentRequest {
  name: string
  provider: 'aws' | 'gcp' | 'azure'
  nodes: Node[]
  edges: Edge[]
  autoApprove?: boolean
}

export interface DeploymentStatus {
  id: string
  workspaceId: string
  status: 'pending' | 'initializing' | 'planning' | 'applying' | 'completed' | 'failed' | 'cancelled' | 'destroying'
  progress: number
  message: string
  logs: string[]
  outputs?: Record<string, any>
  error?: string
  createdAt: string
  updatedAt: string
  plan?: {
    plannedChanges: number
    toAdd: number
    toChange: number
    toDestroy: number
    planOutput: string
  }
  workspace?: {
    id: string
    name: string
    provider: string
    workingDirectory: string
    createdAt: string
    status: 'active' | 'destroyed' | 'failed'
    lastDeployed?: string
  }
}

export interface DeploymentResult {
  success: boolean
  deploymentId: string
  workspaceId: string
  outputs?: Record<string, any>
  error?: string
  logs: string[]
}

export interface TerraformWorkspace {
  id: string
  name: string
  provider: string
  workingDirectory: string
  createdAt: string
  status: 'active' | 'destroyed' | 'failed'
  lastDeployed?: string
}

