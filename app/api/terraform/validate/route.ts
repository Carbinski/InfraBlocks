import { spawn } from 'child_process'
import { NextRequest, NextResponse } from 'next/server'
import { CredentialManager } from '@/lib/credential-manager'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workingDirectory, credentials } = body

    if (!workingDirectory) {
      return NextResponse.json(
        { error: 'Working directory is required' },
        { status: 400 }
      )
    }

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
      console.log('🔑 Using AWS credentials for terraform validate')
    } else {
      console.warn('⚠️ No AWS credentials provided for terraform validate')
    }

    const result = await executeTerraformCommand('validate', [], workingDirectory, env)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error running terraform validate:', error)
    return NextResponse.json(
      { error: 'Failed to run terraform validate' },
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
    const terraform = spawn('terraform', [command, ...args], {
      cwd: workingDirectory,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: env || process.env
    })

    let output = ''
    let error = ''

    terraform.stdout?.on('data', (data) => {
      output += data.toString()
    })

    terraform.stderr?.on('data', (data) => {
      error += data.toString()
    })

    terraform.on('close', (code) => {
      resolve({
        success: code === 0,
        output,
        error: error || undefined,
        exitCode: code || 1
      })
    })

    terraform.on('error', (err) => {
      resolve({
        success: false,
        output,
        error: err.message,
        exitCode: 1
      })
    })
  })
}
