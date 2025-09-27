import { spawn } from 'child_process'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workingDirectory } = body

    if (!workingDirectory) {
      return NextResponse.json(
        { error: 'Working directory is required' },
        { status: 400 }
      )
    }

    const result = await executeTerraformCommand('output', ['-json'], workingDirectory)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error running terraform output:', error)
    return NextResponse.json(
      { error: 'Failed to run terraform output' },
      { status: 500 }
    )
  }
}

function executeTerraformCommand(
  command: string,
  args: string[],
  workingDirectory: string
): Promise<{ success: boolean; output: string; error?: string; exitCode: number }> {
  return new Promise((resolve) => {
    const terraform = spawn('terraform', [command, ...args], {
      cwd: workingDirectory,
      stdio: ['pipe', 'pipe', 'pipe']
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
