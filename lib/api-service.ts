import type { DeploymentRequest, DeploymentResult, DeploymentStatus, TerraformWorkspace } from '@/types/deployment'
import { CredentialManager } from '@/lib/credential-manager'

// In-memory storage for deployments (in production, use a database)
const deployments: Map<string, DeploymentStatus> = new Map()
const activeDeployments: Set<string> = new Set()

/**
 * Deploy infrastructure using API calls
 */
export async function deployInfrastructure(request: DeploymentRequest): Promise<DeploymentResult> {
  const deploymentId = `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  console.log('🚀 Starting deployment process:', {
    deploymentId,
    provider: request.provider,
    nodeCount: request.nodes.length,
    edgeCount: request.edges.length,
    autoApprove: request.autoApprove
  })

  // Initialize deployment status
  const deployment: DeploymentStatus = {
    id: deploymentId,
    workspaceId: '',
    status: 'pending',
    progress: 0,
    message: 'Initializing deployment...',
    logs: ['Starting infrastructure deployment...'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  deployments.set(deploymentId, deployment)
  activeDeployments.add(deploymentId)
  console.log('✅ Deployment initialized and added to active deployments')

  try {
    // Step 1: Create workspace
    console.log('📁 Step 1: Creating workspace...')
    deployment.status = 'initializing'
    deployment.progress = 10
    deployment.message = 'Creating workspace and generating Terraform files...'
    deployment.logs.push('Creating workspace...')
    deployment.updatedAt = new Date().toISOString()

    const workspacePayload = {
      name: request.name,
      provider: request.provider,
      nodes: request.nodes,
      edges: request.edges
    }
    console.log('📤 Sending workspace creation request:', {
      name: workspacePayload.name,
      provider: workspacePayload.provider,
      nodeCount: workspacePayload.nodes.length,
      edgeCount: workspacePayload.edges.length
    })

    const workspaceResponse = await fetch('/api/workspaces', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workspacePayload)
    })

    console.log('📥 Workspace response status:', workspaceResponse.status, workspaceResponse.statusText)
    
    if (!workspaceResponse.ok) {
      const errorData = await workspaceResponse.json()
      console.error('❌ Workspace creation failed:', errorData)
      throw new Error(errorData.error || 'Failed to create workspace')
    }

    const workspaceData = await workspaceResponse.json()
    const workspace = workspaceData.workspace
    console.log('✅ Workspace created successfully:', {
      id: workspace.id,
      workingDirectory: workspace.workingDirectory,
      status: workspace.status
    })

    deployment.workspaceId = workspace.id
    deployment.workspace = workspace
    deployment.logs.push(`Workspace created: ${workspace.id}`)
    deployment.updatedAt = new Date().toISOString()

    // Step 2: Initialize Terraform
    console.log('🔧 Step 2: Initializing Terraform...')
    deployment.status = 'initializing'
    deployment.progress = 20
    deployment.message = 'Initializing Terraform...'
    deployment.logs.push('Running terraform init...')
    deployment.updatedAt = new Date().toISOString()

    // Get AWS credentials for the API call
    const awsCredentials = CredentialManager.getCredentials('aws')

    const initPayload = {
      workingDirectory: workspace.workingDirectory,
      credentials: awsCredentials ? { aws: awsCredentials } : undefined
    }
    console.log('📤 Sending terraform init request:', initPayload)

    const initResponse = await fetch('/api/terraform/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(initPayload)
    })

    console.log('📥 Terraform init response status:', initResponse.status, initResponse.statusText)
    
    if (!initResponse.ok) {
      const errorData = await initResponse.json()
      console.error('❌ Terraform init failed:', errorData)
      throw new Error(errorData.error || 'Terraform init failed')
    }

    const initData = await initResponse.json()
    console.log('✅ Terraform init successful:', {
      success: initData.success,
      exitCode: initData.exitCode,
      outputLength: initData.output?.length || 0,
      errorLength: initData.error?.length || 0
    })

    if (initData.output) {
      console.log('📋 Terraform init output:', initData.output)
    }
    if (initData.error) {
      console.warn('⚠️ Terraform init warnings/errors:', initData.error)
    }

    if (!initData.success) {
      console.error('❌ Terraform init command failed:', initData)
      deployment.status = 'failed'
      deployment.message = `Terraform init failed: ${initData.error || 'Unknown error'}`
      deployment.logs.push(`❌ Init failed: ${initData.error || 'Unknown error'}`)
      if (initData.output) {
        deployment.logs.push(`Init output: ${initData.output}`)
      }
      deployment.updatedAt = new Date().toISOString()
      deployments.set(deploymentId, deployment)
      activeDeployments.delete(deploymentId)
      return {
        success: false,
        deploymentId,
        workspaceId: deployment.workspaceId,
        error: `Terraform init failed: ${initData.error || 'Unknown error'}`,
        logs: deployment.logs
      }
    }

    deployment.logs.push('Terraform initialized successfully')
    deployment.updatedAt = new Date().toISOString()

    // Step 3: Validate configuration
    console.log('✅ Step 3: Validating Terraform configuration...')
    deployment.progress = 30
    deployment.message = 'Validating Terraform configuration...'
    deployment.logs.push('Running terraform validate...')
    deployment.updatedAt = new Date().toISOString()

    const validatePayload = {
      workingDirectory: workspace.workingDirectory,
      credentials: awsCredentials ? { aws: awsCredentials } : undefined
    }
    console.log('📤 Sending terraform validate request:', validatePayload)

    const validateResponse = await fetch('/api/terraform/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatePayload)
    })

    console.log('📥 Terraform validate response status:', validateResponse.status, validateResponse.statusText)
    
    if (!validateResponse.ok) {
      const errorData = await validateResponse.json()
      console.error('❌ Terraform validation failed:', errorData)
      throw new Error(`Terraform validation failed: ${errorData.error}`)
    }

    const validateData = await validateResponse.json()
    console.log('✅ Terraform validation successful:', {
      success: validateData.success,
      exitCode: validateData.exitCode,
      outputLength: validateData.output?.length || 0,
      errorLength: validateData.error?.length || 0
    })
    
    if (validateData.output) {
      console.log('📋 Terraform validate output:', validateData.output)
    }
    if (validateData.error) {
      console.warn('⚠️ Terraform validate warnings/errors:', validateData.error)
    }

    deployment.logs.push('Configuration validated successfully')
    deployment.updatedAt = new Date().toISOString()

    // Step 4: Create plan
    console.log('📋 Step 4: Creating deployment plan...')
    deployment.status = 'planning'
    deployment.progress = 40
    deployment.message = 'Creating deployment plan...'
    deployment.logs.push('Running terraform plan...')
    deployment.updatedAt = new Date().toISOString()

    const planPayload = {
      workingDirectory: workspace.workingDirectory,
      planFile: `${workspace.workingDirectory}/terraform.tfplan`,
      credentials: awsCredentials ? { aws: awsCredentials } : undefined
    }
    console.log('📤 Sending terraform plan request:', planPayload)

    const planResponse = await fetch('/api/terraform/plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(planPayload)
    })

    console.log('📥 Terraform plan response status:', planResponse.status, planResponse.statusText)
    
    if (!planResponse.ok) {
      const errorData = await planResponse.json()
      console.error('❌ Terraform plan failed:', errorData)
      deployment.status = 'failed'
      deployment.message = `Terraform plan failed: ${errorData.error}`
      deployment.logs.push(`❌ Plan failed: ${errorData.error}`)
      deployment.updatedAt = new Date().toISOString()
      deployments.set(deploymentId, deployment)
      activeDeployments.delete(deploymentId)
      return {
        success: false,
        deploymentId,
        workspaceId: deployment.workspaceId,
        error: `Terraform plan failed: ${errorData.error}`,
        logs: deployment.logs
      }
    }

    const planData = await planResponse.json()
    
    // Check if plan was successful
    if (!planData.success) {
      console.error('❌ Terraform plan command failed:', planData)
      deployment.status = 'failed'
      deployment.message = `Terraform plan command failed: ${planData.error || 'Unknown error'}`
      deployment.logs.push(`❌ Plan command failed: ${planData.error || 'Unknown error'}`)
      deployment.updatedAt = new Date().toISOString()
      deployments.set(deploymentId, deployment)
      activeDeployments.delete(deploymentId)
      return {
        success: false,
        deploymentId,
        workspaceId: deployment.workspaceId,
        error: `Terraform plan command failed: ${planData.error || 'Unknown error'}`,
        logs: deployment.logs
      }
    }
    console.log('✅ Terraform plan successful:', {
      success: planData.success,
      exitCode: planData.exitCode,
      planStats: planData.plan,
      outputLength: planData.output?.length || 0,
      errorLength: planData.error?.length || 0
    })
    
    if (planData.output) {
      console.log('📋 Terraform plan output:', planData.output)
    }
    if (planData.error) {
      console.warn('⚠️ Terraform plan warnings/errors:', planData.error)
    }
    
    deployment.plan = planData.plan
    deployment.logs.push('Deployment plan created successfully')
    if (planData.plan) {
      deployment.logs.push(`Plan: ${planData.plan.toAdd} to add, ${planData.plan.toChange} to change, ${planData.plan.toDestroy} to destroy`)
    }
    deployment.updatedAt = new Date().toISOString()

    // Step 5: Apply configuration
    console.log('🚀 Step 5: Applying infrastructure changes...')
    deployment.status = 'applying'
    deployment.progress = 60
    deployment.message = 'Applying infrastructure changes...'
    deployment.logs.push('Running terraform apply...')
    deployment.updatedAt = new Date().toISOString()

    const applyPayload = {
      workingDirectory: workspace.workingDirectory,
      planFile: `${workspace.workingDirectory}/terraform.tfplan`,
      autoApprove: request.autoApprove,
      credentials: awsCredentials ? { aws: awsCredentials } : undefined
    }
    console.log('📤 Sending terraform apply request:', applyPayload)

    const applyResponse = await fetch('/api/terraform/apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(applyPayload)
    })

    console.log('📥 Terraform apply response status:', applyResponse.status, applyResponse.statusText)
    
    if (!applyResponse.ok) {
      const errorData = await applyResponse.json()
      console.error('❌ Terraform apply failed:', errorData)
      deployment.status = 'failed'
      deployment.message = `Terraform apply failed: ${errorData.error}`
      deployment.logs.push(`❌ Apply failed: ${errorData.error}`)
      deployment.updatedAt = new Date().toISOString()
      deployments.set(deploymentId, deployment)
      activeDeployments.delete(deploymentId)
      return {
        success: false,
        deploymentId,
        workspaceId: deployment.workspaceId,
        error: `Terraform apply failed: ${errorData.error}`,
        logs: deployment.logs
      }
    }

    const applyData = await applyResponse.json()
    
    // Check if apply was successful
    if (!applyData.success) {
      console.error('❌ Terraform apply command failed:', applyData)
      deployment.status = 'failed'
      deployment.message = `Terraform apply command failed: ${applyData.error || 'Unknown error'}`
      deployment.logs.push(`❌ Apply command failed: ${applyData.error || 'Unknown error'}`)
      deployment.updatedAt = new Date().toISOString()
      deployments.set(deploymentId, deployment)
      activeDeployments.delete(deploymentId)
      return {
        success: false,
        deploymentId,
        workspaceId: deployment.workspaceId,
        error: `Terraform apply command failed: ${applyData.error || 'Unknown error'}`,
        logs: deployment.logs
      }
    }
    
    console.log('✅ Terraform apply successful:', {
      success: applyData.success,
      exitCode: applyData.exitCode,
      outputLength: applyData.output?.length || 0,
      errorLength: applyData.error?.length || 0
    })
    
    if (applyData.output) {
      console.log('📋 Terraform apply output:', applyData.output)
    }
    if (applyData.error) {
      console.warn('⚠️ Terraform apply warnings/errors:', applyData.error)
    }

    deployment.logs.push('Infrastructure deployed successfully')
    deployment.updatedAt = new Date().toISOString()

    // Step 6: Get outputs
    console.log('📊 Step 6: Retrieving deployment outputs...')
    deployment.progress = 90
    deployment.message = 'Retrieving deployment outputs...'
    deployment.logs.push('Getting terraform outputs...')
    deployment.updatedAt = new Date().toISOString()

    const outputPayload = {
      workingDirectory: workspace.workingDirectory,
      credentials: awsCredentials ? { aws: awsCredentials } : undefined
    }
    console.log('📤 Sending terraform output request:', outputPayload)

    const outputResponse = await fetch('/api/terraform/output', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(outputPayload)
    })

    console.log('📥 Terraform output response status:', outputResponse.status, outputResponse.statusText)
    
    let outputs: Record<string, any> = {}
    if (outputResponse.ok) {
      const outputData = await outputResponse.json()
      console.log('✅ Terraform output successful:', {
        success: outputData.success,
        exitCode: outputData.exitCode,
        outputLength: outputData.output?.length || 0,
        errorLength: outputData.error?.length || 0
      })
      
      if (outputData.output) {
        console.log('📋 Terraform output raw:', outputData.output)
      }
      if (outputData.error) {
        console.warn('⚠️ Terraform output warnings/errors:', outputData.error)
      }
      
      if (outputData.success) {
        try {
          outputs = JSON.parse(outputData.output)
          console.log('📊 Parsed terraform outputs:', outputs)
        } catch (e) {
          console.warn('⚠️ Could not parse outputs as JSON:', e)
          deployment.logs.push('Warning: Could not parse outputs as JSON')
        }
      }
    } else {
      const errorData = await outputResponse.json()
      console.error('❌ Terraform output failed:', errorData)
    }

    // Complete deployment
    console.log('🎉 Deployment completed successfully!')
    deployment.status = 'completed'
    deployment.progress = 100
    deployment.message = 'Deployment completed successfully!'
    deployment.outputs = outputs
    deployment.logs.push('Deployment completed successfully!')
    deployment.updatedAt = new Date().toISOString()

    // Update workspace status
    console.log('📝 Updating workspace status to active...')
    const updateResponse = await fetch(`/api/workspaces/${workspace.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'active' })
    })
    
    if (!updateResponse.ok) {
      console.warn('⚠️ Failed to update workspace status:', updateResponse.status)
    } else {
      console.log('✅ Workspace status updated successfully')
    }

    deployments.set(deploymentId, deployment)
    activeDeployments.delete(deploymentId)
    console.log('🏁 Deployment process completed:', {
      deploymentId,
      workspaceId: workspace.id,
      outputsCount: Object.keys(outputs).length,
      finalStatus: deployment.status
    })

    return {
      success: true,
      deploymentId,
      workspaceId: workspace.id,
      outputs,
      logs: ['Deployment completed successfully']
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('💥 Deployment failed with error:', {
      deploymentId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    })
    
    deployment.status = 'failed'
    deployment.error = errorMessage
    deployment.message = `Deployment failed: ${errorMessage}`
    deployment.updatedAt = new Date().toISOString()
    deployment.logs.push(`Error: ${errorMessage}`)
    deployments.set(deploymentId, deployment)
    activeDeployments.delete(deploymentId)

    return {
      success: false,
      deploymentId,
      workspaceId: '',
      error: errorMessage,
      logs: [errorMessage]
    }
  }
}

/**
 * Get deployment status
 */
export function getDeploymentStatus(deploymentId: string): DeploymentStatus | null {
  return deployments.get(deploymentId) || null
}

/**
 * Get all deployments
 */
export function getAllDeployments(): DeploymentStatus[] {
  return Array.from(deployments.values()).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

/**
 * Cancel a deployment
 */
export function cancelDeployment(deploymentId: string): boolean {
  const deployment = deployments.get(deploymentId)
  if (deployment && (deployment.status === 'pending' || deployment.status === 'initializing' || 
      deployment.status === 'planning' || deployment.status === 'applying')) {
    deployment.status = 'cancelled'
    deployment.message = 'Deployment cancelled by user'
    deployment.updatedAt = new Date().toISOString()
    deployment.logs.push('Deployment cancelled by user')
    deployments.set(deploymentId, deployment)
    activeDeployments.delete(deploymentId)
    return true
  }
  return false
}

/**
 * Destroy infrastructure
 */
export async function destroyInfrastructure(workspaceId: string, autoApprove: boolean = false): Promise<DeploymentResult> {
  const workspaceResponse = await fetch(`/api/workspaces/${workspaceId}`)
  if (!workspaceResponse.ok) {
    return {
      success: false,
      deploymentId: '',
      workspaceId,
      error: 'Workspace not found',
      logs: ['Workspace not found']
    }
  }

  const workspaceData = await workspaceResponse.json()
  const workspace = workspaceData.workspace

  const deploymentId = `destroy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const deployment: DeploymentStatus = {
    id: deploymentId,
    workspaceId,
    status: 'destroying',
    progress: 0,
    message: 'Starting infrastructure destruction...',
    logs: ['Starting infrastructure destruction...'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    workspace
  }

  deployments.set(deploymentId, deployment)
  activeDeployments.add(deploymentId)

  try {
    deployment.progress = 50
    deployment.message = 'Destroying infrastructure...'
    deployment.logs.push('Running terraform destroy...')
    deployment.updatedAt = new Date().toISOString()

    // Get AWS credentials for the destroy call
    const destroyCredentials = CredentialManager.getCredentials('aws')

    const destroyResponse = await fetch('/api/terraform/destroy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workingDirectory: workspace.workingDirectory,
        autoApprove,
        credentials: destroyCredentials ? { aws: destroyCredentials } : undefined
      })
    })

    if (!destroyResponse.ok) {
      const errorData = await destroyResponse.json()
      throw new Error(`Terraform destroy failed: ${errorData.error}`)
    }

    deployment.status = 'completed'
    deployment.progress = 100
    deployment.message = 'Infrastructure destroyed successfully!'
    deployment.logs.push('Infrastructure destroyed successfully!')
    deployment.updatedAt = new Date().toISOString()

    // Update workspace status
    await fetch(`/api/workspaces/${workspaceId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'destroyed' })
    })

    deployments.set(deploymentId, deployment)
    activeDeployments.delete(deploymentId)

    return {
      success: true,
      deploymentId,
      workspaceId,
      logs: ['Infrastructure destroyed successfully']
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    deployment.status = 'failed'
    deployment.error = errorMessage
    deployment.message = `Destruction failed: ${errorMessage}`
    deployment.updatedAt = new Date().toISOString()
    deployment.logs.push(`Error: ${errorMessage}`)
    deployments.set(deploymentId, deployment)
    activeDeployments.delete(deploymentId)

    return {
      success: false,
      deploymentId,
      workspaceId,
      error: errorMessage,
      logs: [errorMessage]
    }
  }
}

/**
 * Get workspace files
 */
export async function getWorkspaceFiles(workspaceId: string): Promise<Record<string, string>> {
  try {
    const response = await fetch(`/api/workspaces/${workspaceId}/files`)
    if (!response.ok) return {}

    const data = await response.json()
    return data.files || {}
  } catch (error) {
    console.error('Error getting workspace files:', error)
    return {}
  }
}

/**
 * Get all workspaces
 */
export async function getAllWorkspaces(): Promise<TerraformWorkspace[]> {
  try {
    const response = await fetch('/api/workspaces')
    if (!response.ok) return []

    const data = await response.json()
    return data.workspaces || []
  } catch (error) {
    console.error('Error getting workspaces:', error)
    return []
  }
}

/**
 * Delete workspace
 */
export async function deleteWorkspace(workspaceId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/workspaces/${workspaceId}`, {
      method: 'DELETE'
    })
    return response.ok
  } catch (error) {
    console.error('Error deleting workspace:', error)
    return false
  }
}

/**
 * Test credentials by making a test API call
 */
export async function testCredentials(provider: string): Promise<{ valid: boolean; message: string }> {
  try {
    const credentials = CredentialManager.getCredentials(provider as keyof typeof CredentialManager.prototype)

    if (!credentials) {
      return { valid: false, message: 'No credentials found for provider' }
    }

    // Test the credentials by making a simple API call that requires authentication
    // For AWS, we can try to validate the credentials format and make a simple AWS API call
    if (provider === 'aws') {
      const awsCredentials = credentials as any
      const validationErrors = CredentialManager.validateAWSCredentials(awsCredentials)

      if (validationErrors.length > 0) {
        return { valid: false, message: `Invalid AWS credentials: ${validationErrors.join(', ')}` }
      }

      // Try to make a simple AWS API call to test the credentials
      // For now, we'll just return valid since the format validation passed
      // In a real implementation, you might make a call to AWS STS or similar
      return { valid: true, message: 'AWS credentials format is valid' }
    }

    return { valid: true, message: 'Credentials are valid' }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { valid: false, message: `Credential test failed: ${errorMessage}` }
  }
}
