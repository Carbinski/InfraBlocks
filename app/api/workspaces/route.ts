import { TerraformGenerator } from '@/components/terraform-generator'
import type { Edge, Node } from '@xyflow/react'
import { promises as fs } from 'fs'
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'

export interface TerraformWorkspace {
  id: string
  name: string
  provider: string
  workingDirectory: string
  createdAt: string
  status: 'active' | 'destroyed' | 'failed'
  lastDeployed?: string
}

export interface GeneratedFiles {
  mainTf: string
  variablesTf: string
  outputsTf: string
  terraformTf: string
  additionalFiles: Record<string, string>
}

// In-memory storage for workspaces (in production, use a database)
const workspaces: Map<string, TerraformWorkspace> = new Map()
const baseDirectory = path.join(process.cwd(), 'terraform-workspaces')

/**
 * Create a new Terraform workspace
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, provider, nodes, edges } = body

    if (!name || !provider || !nodes || !edges) {
      return NextResponse.json(
        { error: 'Missing required fields: name, provider, nodes, edges' },
        { status: 400 }
      )
    }

    const workspaceId = `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const workingDirectory = path.join(baseDirectory, workspaceId)

    // Create workspace directory
    await fs.mkdir(workingDirectory, { recursive: true })

    const workspace: TerraformWorkspace = {
      id: workspaceId,
      name,
      provider,
      workingDirectory,
      createdAt: new Date().toISOString(),
      status: 'active'
    }

    workspaces.set(workspaceId, workspace)

    // Generate Terraform files
    await generateTerraformFiles(workspace, nodes, edges)

    return NextResponse.json({ workspace })
  } catch (error) {
    console.error('Error creating workspace:', error)
    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    )
  }
}

/**
 * Get all workspaces
 */
export async function GET() {
  try {
    const allWorkspaces = Array.from(workspaces.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return NextResponse.json({ workspaces: allWorkspaces })
  } catch (error) {
    console.error('Error getting workspaces:', error)
    return NextResponse.json(
      { error: 'Failed to get workspaces' },
      { status: 500 }
    )
  }
}

/**
 * Generate all Terraform files for a workspace
 */
async function generateTerraformFiles(
  workspace: TerraformWorkspace,
  nodes: Node[],
  edges: Edge[]
): Promise<GeneratedFiles> {
  const generator = new TerraformGenerator(workspace.provider, nodes, edges)
  const output = generator.generate()

  // Generate main.tf with only resources (no variables, outputs, or provider config)
  const mainTf = generateMainTfOnly(output.resources)
  await fs.writeFile(path.join(workspace.workingDirectory, 'main.tf'), mainTf, 'utf8')

  // Generate variables.tf
  const variablesTf = generateVariablesFile(output.variables)
  await fs.writeFile(path.join(workspace.workingDirectory, 'variables.tf'), variablesTf, 'utf8')

  // Generate outputs.tf
  const outputsTf = generateOutputsFile(output.outputs)
  await fs.writeFile(path.join(workspace.workingDirectory, 'outputs.tf'), outputsTf, 'utf8')

  // Generate terraform.tf (provider configuration)
  const terraformTf = generateTerraformConfigFile(workspace.provider)
  await fs.writeFile(path.join(workspace.workingDirectory, 'terraform.tf'), terraformTf, 'utf8')

  // Generate additional provider-specific files
  const additionalFiles = await generateAdditionalFiles(workspace, nodes)

  const generatedFiles: GeneratedFiles = {
    mainTf,
    variablesTf,
    outputsTf,
    terraformTf,
    additionalFiles
  }

  // Save generated files info
  await fs.writeFile(
    path.join(workspace.workingDirectory, 'generated-files.json'),
    JSON.stringify(generatedFiles, null, 2),
    'utf8'
  )

  return generatedFiles
}

/**
 * Generate main.tf file with only resources
 */
function generateMainTfOnly(resources: any[]): string {
  let content = '# Resources\n\n'
  
  resources.forEach((resource) => {
    content += `resource "${resource.type}" "${resource.name}" {\n`
    
    // Format resource configuration
    Object.entries(resource.config).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return
      }
      
      if (typeof value === 'string') {
        if (value.startsWith('var.') || value.startsWith('aws_') || value.startsWith('google_') || value.startsWith('azurerm_')) {
          content += `  ${key} = ${value}\n`
        } else {
          content += `  ${key} = "${value}"\n`
        }
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        content += `  ${key} = ${value}\n`
      } else if (Array.isArray(value)) {
        content += `  ${key} = [${value.map(v => typeof v === 'string' ? `"${v}"` : v).join(', ')}]\n`
      } else if (typeof value === 'object') {
        // Special handling for different types of objects
        if (key === 'tags') {
          // Tags should always be arguments
          content += `  ${key} = {\n`
        } else if (key === 'versioning' || key === 'lifecycle' || key === 'provisioner') {
          // These should be blocks
          content += `  ${key} {\n`
        } else {
          content += `  ${key} {\n`
        }
        content += formatResourceConfig(value, 2, key)
        content += `  }\n`
      }
    })
    
    if (resource.dependencies && resource.dependencies.length > 0) {
      content += `  depends_on = [${resource.dependencies.map((dep: string) => `${dep}`).join(', ')}]\n`
    }
    
    content += '}\n\n'
  })
  
  return content
}

/**
 * Helper function to format nested resource configurations
 */
function formatResourceConfig(config: Record<string, any>, indent: number, parentKey?: string): string {
  let result = ''
  const spaces = '  '.repeat(indent)
  
  Object.entries(config).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return
    }
    
    if (typeof value === 'string') {
      if (value.startsWith('var.') || value.startsWith('aws_') || value.startsWith('google_') || value.startsWith('azurerm_')) {
        result += `${spaces}${key} = ${value}\n`
      } else {
        result += `${spaces}${key} = "${value}"\n`
      }
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      result += `${spaces}${key} = ${value}\n`
    } else if (Array.isArray(value)) {
      result += `${spaces}${key} = [${value.map(v => typeof v === 'string' ? `"${v}"` : v).join(', ')}]\n`
    } else if (typeof value === 'object') {
      // Special handling for different types of objects
      if (key === 'tags' || parentKey === 'tags') {
        // Tags should always be arguments
        result += `${spaces}${key} = {\n`
      } else if (key === 'versioning' || key === 'lifecycle' || key === 'provisioner') {
        // These should be blocks
        result += `${spaces}${key} {\n`
      } else {
        result += `${spaces}${key} {\n`
      }
      result += formatResourceConfig(value, indent + 1, key)
      result += `${spaces}}\n`
    }
  })
  
  return result
}

/**
 * Generate variables.tf file
 */
function generateVariablesFile(variables: Record<string, any>): string {
  let content = '# Variables\n\n'

  Object.entries(variables).forEach(([name, config]) => {
    content += `variable "${name}" {\n`
    Object.entries(config as Record<string, any>).forEach(([key, value]) => {
      if (key === 'type' && value === 'string') {
        content += `  ${key} = ${value}\n`
      } else if (typeof value === 'string') {
        content += `  ${key} = "${value}"\n`
      } else if (typeof value === 'boolean') {
        content += `  ${key} = ${value}\n`
      } else {
        content += `  ${key} = ${JSON.stringify(value)}\n`
      }
    })
    content += '}\n\n'
  })

  return content
}

/**
 * Generate outputs.tf file
 */
function generateOutputsFile(outputs: Record<string, any>): string {
  let content = '# Outputs\n\n'

  Object.entries(outputs).forEach(([name, config]) => {
    content += `output "${name}" {\n`
    Object.entries(config as Record<string, any>).forEach(([key, value]) => {
      if (typeof value === 'string') {
        content += `  ${key} = "${value}"\n`
      } else {
        content += `  ${key} = ${value}\n`
      }
    })
    content += '}\n\n'
  })

  return content
}

/**
 * Generate terraform.tf file with provider configuration
 */
function generateTerraformConfigFile(provider: string): string {
  switch (provider) {
    case 'aws':
      return `terraform {
  required_version = ">= 1.0"
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

    case 'gcp':
      return `terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
`

    case 'azure':
      return `terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "main" {
  name     = "rg-\${var.environment}"
  location = var.region
}
`

    default:
      return ''
  }
}

/**
 * Generate additional provider-specific files
 */
async function generateAdditionalFiles(
  workspace: TerraformWorkspace,
  nodes: Node[]
): Promise<Record<string, string>> {
  const additionalFiles: Record<string, string> = {}

  switch (workspace.provider) {
    case 'aws':
      // Generate security groups
      const securityGroups = generateAWSSecurityGroups(nodes)
      if (securityGroups) {
        additionalFiles['security-groups.tf'] = securityGroups
        await fs.writeFile(
          path.join(workspace.workingDirectory, 'security-groups.tf'),
          securityGroups,
          'utf8'
        )
      }

      // Generate VPC configuration
      const vpcConfig = generateAWSVPCConfig(nodes)
      if (vpcConfig) {
        additionalFiles['vpc.tf'] = vpcConfig
        await fs.writeFile(
          path.join(workspace.workingDirectory, 'vpc.tf'),
          vpcConfig,
          'utf8'
        )
      }
      break

    case 'gcp':
      // Generate GCP-specific configurations
      const gcpConfig = generateGCPConfig(nodes)
      if (gcpConfig) {
        additionalFiles['gcp-config.tf'] = gcpConfig
        await fs.writeFile(
          path.join(workspace.workingDirectory, 'gcp-config.tf'),
          gcpConfig,
          'utf8'
        )
      }
      break

    case 'azure':
      // Generate Azure-specific configurations
      const azureConfig = generateAzureConfig(nodes)
      if (azureConfig) {
        additionalFiles['azure-config.tf'] = azureConfig
        await fs.writeFile(
          path.join(workspace.workingDirectory, 'azure-config.tf'),
          azureConfig,
          'utf8'
        )
      }
      break
  }

  return additionalFiles
}

/**
 * Generate AWS security groups
 */
function generateAWSSecurityGroups(nodes: Node[]): string {
  const hasEC2 = nodes.some(node => node.data.id === 'ec2')
  if (!hasEC2) return ''

  return `# Security Groups
resource "aws_security_group" "default" {
  name_prefix = "default-sg-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "default-security-group"
  }
}
`
}

/**
 * Generate AWS VPC configuration
 */
function generateAWSVPCConfig(nodes: Node[]): string {
  const hasVPC = nodes.some(node => node.data.id === 'vpc')
  if (!hasVPC) return ''

  return `# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "main-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "main-igw"
  }
}

resource "aws_subnet" "main" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "\${var.region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "main-subnet"
  }
}

resource "aws_route_table" "main" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "main-route-table"
  }
}

resource "aws_route_table_association" "main" {
  subnet_id      = aws_subnet.main.id
  route_table_id = aws_route_table.main.id
}
`
}

/**
 * Generate GCP configuration
 */
function generateGCPConfig(nodes: Node[]): string {
  return `# GCP Configuration
resource "google_compute_network" "main" {
  name                    = "main-network"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "main" {
  name          = "main-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.main.id
}

resource "google_compute_firewall" "default" {
  name    = "default-firewall"
  network = google_compute_network.main.name

  allow {
    protocol = "tcp"
    ports    = ["22", "80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
}
`
}

/**
 * Generate Azure configuration
 */
function generateAzureConfig(nodes: Node[]): string {
  return `# Azure Configuration
resource "azurerm_virtual_network" "main" {
  name                = "main-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
}

resource "azurerm_subnet" "main" {
  name                 = "main-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_network_security_group" "main" {
  name                = "main-nsg"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  security_rule {
    name                       = "SSH"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "HTTP"
    priority                   = 1002
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}
`
}

// Export the workspaces map for use by other API routes
export { workspaces }
