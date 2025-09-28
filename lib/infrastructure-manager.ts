// Global infrastructure manager - simple direct API for AI to add nodes to canvas
import type { Node, Edge } from "@xyflow/react"
import { ConfigLoader } from "@/lib/config-loader"

interface InfrastructureComponent {
  id: string
  name: string
  provider: "aws" | "gcp" | "azure"
  service: string
  position: {
    x: number
    y: number
  }
  config: Record<string, any>
}

interface InfrastructureConnection {
  id: string
  source: string
  target: string
  relationship: string
  description?: string
}

// Global reference to canvas functions
let globalAddNodesToCanvas: ((nodes: Node[]) => void) | null = null
let globalAddEdgesToCanvas: ((edges: Edge[]) => void) | null = null
let globalGetCanvasState: (() => { nodes: Node[], edges: Edge[] }) | null = null

// Register the canvas functions when canvas initializes
export function registerCanvasFunctions(
  addNodesFunction: (nodes: Node[]) => void,
  addEdgesFunction?: (edges: Edge[]) => void,
  getCanvasStateFunction?: () => { nodes: Node[], edges: Edge[] }
) {
  console.log('🎨 Infrastructure Manager: Canvas functions registered')
  globalAddNodesToCanvas = addNodesFunction
  globalAddEdgesToCanvas = addEdgesFunction || null
  globalGetCanvasState = getCanvasStateFunction || null
}

// Unregister when canvas unmounts
export function unregisterCanvasFunctions() {
  console.log('🎨 Infrastructure Manager: Canvas functions unregistered')
  globalAddNodesToCanvas = null
  globalAddEdgesToCanvas = null
  globalGetCanvasState = null
}

// Add infrastructure to canvas - called by AI
export async function addInfrastructureToCanvas(components: InfrastructureComponent[]) {
  console.log('🎯 Infrastructure Manager: Adding infrastructure to canvas')
  console.log('📦 Infrastructure Manager: Components:', components.length)

  if (!globalAddNodesToCanvas) {
    console.warn('⚠️ Infrastructure Manager: No canvas available - components queued')
    return false
  }

  try {
    // Convert components to nodes (same as drag & drop) with full service config
    const nodes: Node[] = await Promise.all(components.map(async (component) => {
      // Load the full service configuration data
      let serviceConfig = await ConfigLoader.loadServiceConfig(component.provider, component.service)

      // Fallback if config not found
      if (!serviceConfig) {
        console.warn(`⚠️ Infrastructure Manager: No config found for ${component.provider}/${component.service}, using fallback`)
        serviceConfig = {
          id: component.service,
          name: component.name,
          icon: '/aws/ec2.svg', // Generic AWS icon as fallback
          category: 'Infrastructure',
          description: `${component.service} service`,
          terraformType: component.service
        }
      }

      return {
        id: component.id,
        type: "cloudService",
        position: component.position,
        data: {
          // Include all service config data (like drag & drop does)
          ...serviceConfig,
          // Override with component-specific data
          id: component.id,
          name: component.name,
          service: component.service,
          provider: component.provider,
          config: component.config || {},
          terraformType: component.service,
        },
      }
    }))

    console.log('✅ Infrastructure Manager: Created nodes with full config, calling canvas add function')
    globalAddNodesToCanvas(nodes)

    // Generate connections between components
    const edges = generateConnections(components)
    if (edges.length > 0 && globalAddEdgesToCanvas) {
      console.log('🔗 Infrastructure Manager: Generated connections:', edges.length)
      globalAddEdgesToCanvas(edges)
    }

    console.log('🎉 Infrastructure Manager: Infrastructure and connections added to canvas successfully!')

    return true
  } catch (error) {
    console.error('❌ Infrastructure Manager: Failed to add infrastructure:', error)
    return false
  }
}

// Generate connections between infrastructure components
function generateConnections(components: InfrastructureComponent[]): Edge[] {
  const edges: Edge[] = []
  
  // Group components by service type
  const componentsByService = components.reduce((acc, comp) => {
    const serviceType = comp.service
    if (!acc[serviceType]) acc[serviceType] = []
    acc[serviceType].push(comp)
    return acc
  }, {} as Record<string, InfrastructureComponent[]>)

  // Generate connections based on service types
  const apiGateways = componentsByService['api_gateway'] || []
  const sqsQueues = componentsByService['sqs'] || []
  const s3Buckets = componentsByService['s3'] || []
  const dynamoDBTables = componentsByService['dynamodb'] || []
  const rdsInstances = componentsByService['rds'] || []

  // Web Application Pattern: API Gateway + SQS + S3 + DynamoDB
  if (apiGateways.length > 0 && sqsQueues.length > 0 && s3Buckets.length > 0 && dynamoDBTables.length > 0) {
    const apiGateway = apiGateways[0]
    const sqsQueue = sqsQueues[0]
    const s3Bucket = s3Buckets[0]
    const dynamoTable = dynamoDBTables[0]

    // API Gateway -> SQS
    edges.push({
      id: `${apiGateway.id}-to-${sqsQueue.id}`,
      source: apiGateway.id,
      target: sqsQueue.id,
      type: 'smoothstep',
      style: { strokeWidth: 2, stroke: '#10b981' },
      data: {
        relationship: 'sends_to',
        description: 'API Gateway sends messages to SQS queue'
      }
    })

    // API Gateway -> DynamoDB
    edges.push({
      id: `${apiGateway.id}-to-${dynamoTable.id}`,
      source: apiGateway.id,
      target: dynamoTable.id,
      type: 'smoothstep',
      style: { strokeWidth: 2, stroke: '#10b981' },
      data: {
        relationship: 'accesses',
        description: 'API Gateway accesses DynamoDB for data'
      }
    })

    // API Gateway -> S3
    edges.push({
      id: `${apiGateway.id}-to-${s3Bucket.id}`,
      source: apiGateway.id,
      target: s3Bucket.id,
      type: 'smoothstep',
      style: { strokeWidth: 2, stroke: '#10b981' },
      data: {
        relationship: 'serves_from',
        description: 'API Gateway serves static assets from S3'
      }
    })

    // SQS -> DynamoDB
    edges.push({
      id: `${sqsQueue.id}-to-${dynamoTable.id}`,
      source: sqsQueue.id,
      target: dynamoTable.id,
      type: 'smoothstep',
      style: { strokeWidth: 2, stroke: '#10b981' },
      data: {
        relationship: 'processes_to',
        description: 'SQS consumers process data to DynamoDB'
      }
    })

    // SQS -> S3
    edges.push({
      id: `${sqsQueue.id}-to-${s3Bucket.id}`,
      source: sqsQueue.id,
      target: s3Bucket.id,
      type: 'smoothstep',
      style: { strokeWidth: 2, stroke: '#10b981' },
      data: {
        relationship: 'processes_from',
        description: 'SQS consumers process files from S3'
      }
    })
  }

  // API + Database Pattern: API Gateway + DynamoDB
  if (apiGateways.length > 0 && dynamoDBTables.length > 0 && sqsQueues.length === 0) {
    const apiGateway = apiGateways[0]
    const dynamoTable = dynamoDBTables[0]

    edges.push({
      id: `${apiGateway.id}-to-${dynamoTable.id}`,
      source: apiGateway.id,
      target: dynamoTable.id,
      type: 'smoothstep',
      style: { strokeWidth: 2, stroke: '#10b981' },
      data: {
        relationship: 'accesses',
        description: 'API Gateway accesses DynamoDB for data storage'
      }
    })
  }

  // API + RDS Pattern: API Gateway + RDS
  if (apiGateways.length > 0 && rdsInstances.length > 0) {
    const apiGateway = apiGateways[0]
    const rdsInstance = rdsInstances[0]

    edges.push({
      id: `${apiGateway.id}-to-${rdsInstance.id}`,
      source: apiGateway.id,
      target: rdsInstance.id,
      type: 'smoothstep',
      style: { strokeWidth: 2, stroke: '#10b981' },
      data: {
        relationship: 'connects_to',
        description: 'API Gateway connects to RDS database'
      }
    })
  }

  // SQS + Storage Pattern: SQS + S3
  if (sqsQueues.length > 0 && s3Buckets.length > 0 && apiGateways.length === 0) {
    const sqsQueue = sqsQueues[0]
    const s3Bucket = s3Buckets[0]

    edges.push({
      id: `${sqsQueue.id}-to-${s3Bucket.id}`,
      source: sqsQueue.id,
      target: s3Bucket.id,
      type: 'smoothstep',
      style: { strokeWidth: 2, stroke: '#10b981' },
      data: {
        relationship: 'processes',
        description: 'SQS processes files in S3 bucket'
      }
    })
  }

  console.log('🔗 Generated connections:', edges.length, 'for components:', components.length)
  return edges
}

// Get current canvas state - called by AI to understand existing infrastructure
export function getCanvasState() {
  if (!globalGetCanvasState) {
    console.warn('⚠️ Infrastructure Manager: No canvas state getter available')
    return { nodes: [], edges: [] }
  }

  const state = globalGetCanvasState()
  console.log('📊 Infrastructure Manager: Current canvas state:', {
    nodesCount: state.nodes.length,
    edgesCount: state.edges.length
  })
  return state
}

// Get human-readable summary of canvas infrastructure
export function getCanvasInfrastructureSummary(): string {
  const { nodes, edges } = getCanvasState()

  if (nodes.length === 0) {
    return "You currently have no infrastructure deployed on your canvas."
  }

  const services = nodes.map(node => ({
    name: node.data?.name || node.id,
    service: node.data?.service || 'unknown',
    provider: node.data?.provider || 'unknown'
  }))

  const serviceCounts = services.reduce((acc, service) => {
    const key = `${service.provider}/${service.service}`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const serviceList = Object.entries(serviceCounts)
    .map(([service, count]) => `${count}x ${service}`)
    .join(', ')

  const connections = edges.length > 0 ? ` with ${edges.length} connection${edges.length !== 1 ? 's' : ''}` : ' (no connections yet)'

  return `You have ${nodes.length} infrastructure component${nodes.length !== 1 ? 's' : ''} on your canvas: ${serviceList}${connections}.`
}

// Helper function to convert API response to infrastructure components
export function convertApiResponseToComponents(apiResponse: any): InfrastructureComponent[] {
  if (!apiResponse.createInfrastructure || !Array.isArray(apiResponse.createInfrastructure)) {
    return []
  }

  return apiResponse.createInfrastructure.map((component: any, index: number) => ({
    id: component.id || `component-${index}`,
    name: component.name || component.id,
    provider: component.provider || 'aws',
    service: component.service || 'unknown',
    position: {
      x: component.position?.x || (100 + (index * 200)),
      y: component.position?.y || (100 + (index * 100))
    },
    config: component.config || {}
  }))
}
