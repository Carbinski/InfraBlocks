import { spawn } from 'child_process'
import { NextRequest, NextResponse } from 'next/server'
import { CredentialManager } from '@/lib/credential-manager'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workingDirectory, credentials } = body

    // Set AWS credentials as environment variables if provided
    const env = { ...process.env }
    if (credentials?.aws) {
      // Validate AWS credentials format
      const validationErrors = CredentialManager.validateAWSCredentials(credentials.aws)
      if (validationErrors.length > 0) {
        return NextResponse.json(
          { error: `Invalid AWS credentials: ${validationErrors.join(', ')}` },
          { status: 400 }
        )
      }

      env.AWS_ACCESS_KEY_ID = credentials.aws.accessKeyId
      env.AWS_SECRET_ACCESS_KEY = credentials.aws.secretAccessKey
      env.AWS_DEFAULT_REGION = credentials.aws.region
      console.log('🔑 Using AWS credentials for terraform init')
    } else {
      console.warn('⚠️ No AWS credentials provided for terraform init')
    }
    
    console.log('🔧 Terraform Init API called:', {
      workingDirectory,
      timestamp: new Date().toISOString()
    })

    if (!workingDirectory) {
      console.error('❌ Missing working directory')
      return NextResponse.json(
        { error: 'Working directory is required' },
        { status: 400 }
      )
    }

    console.log('🚀 Executing terraform init command...')
    const result = await executeTerraformCommand('init', [], workingDirectory, env)

    console.log('📊 Terraform init result:', {
      success: result.success,
      exitCode: result.exitCode,
      outputLength: result.output?.length || 0,
      errorLength: result.error?.length || 0
    })

    if (result.output) {
      console.log('📋 Terraform init output:', result.output)
    }
    if (result.error) {
      console.error('⚠️ Terraform init error:', result.error)
    }

    // If terraform init failed, return the actual error from terraform
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Terraform init failed',
        output: result.output,
        exitCode: result.exitCode
      })
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('💥 Error running terraform init:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json(
      { error: 'Failed to run terraform init' },
      { status: 500 }
    )
  }
}

function executeTerraformCommand(
  command: string,
  args: string[],
  workingDirectory: string,
  env?: NodeJS.ProcessEnv
): Promise<{ success: boolean; output: string; error?: string; exitCode: number }> {
  return new Promise((resolve) => {
    const fullCommand = `terraform ${command} ${args.join(' ')}`
    console.log('🔧 Executing command:', {
      command: fullCommand,
      workingDirectory,
      timestamp: new Date().toISOString()
    })
    
    const terraform = spawn('terraform', [command, ...args], {
      cwd: workingDirectory,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: env || process.env
    })

    let output = ''
    let error = ''

    terraform.stdout?.on('data', (data) => {
      const chunk = data.toString()
      output += chunk
      console.log('📤 Terraform stdout:', chunk.trim())
    })

    terraform.stderr?.on('data', (data) => {
      const chunk = data.toString()
      error += chunk
      console.log('📥 Terraform stderr:', chunk.trim())
    })

    terraform.on('close', (code) => {
      console.log('🏁 Terraform command finished:', {
        command: fullCommand,
        exitCode: code,
        success: code === 0,
        outputLength: output.length,
        errorLength: error.length
      })

      resolve({
        success: code === 0,
        output,
        error: error || (code !== 0 ? `Terraform exited with code ${code}` : undefined),
        exitCode: code || 1
      })
    })

    terraform.on('error', (err) => {
      console.error('💥 Terraform spawn error:', {
        command: fullCommand,
        error: err.message,
        code: (err as any).code
      })
      
      resolve({
        success: false,
        output,
        error: err.message,
        exitCode: 1
      })
    })
  })
}
