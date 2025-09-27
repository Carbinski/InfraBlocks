import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workingDirectory, planFile } = body

    console.log('🚀 Terraform Plan API called:', {
      workingDirectory,
      planFile,
      timestamp: new Date().toISOString()
    })

    if (!workingDirectory) {
      console.error('❌ Missing working directory')
      return NextResponse.json(
        { error: 'Working directory is required' },
        { status: 400 }
      )
    }

    const args = planFile ? ['-out', planFile] : []
    console.log('🚀 Executing terraform plan command with args:', args)
    const result = await executeTerraformCommand('plan', args, workingDirectory)
    
    console.log('📊 Terraform plan result:', {
      success: result.success,
      exitCode: result.exitCode,
      outputLength: result.output?.length || 0,
      errorLength: result.error?.length || 0
    })
    
    if (result.output) {
      console.log('📋 Terraform plan output:', result.output)
    }
    if (result.error) {
      console.warn('⚠️ Terraform plan warnings/errors:', result.error)
    }
    
    // Verify plan file was created if planFile was specified
    if (planFile) {
      const planFileExists = existsSync(planFile)
      console.log('📁 Plan file check:', {
        planFile,
        exists: planFileExists
      })
      
      if (!planFileExists && result.success) {
        console.warn('⚠️ Plan command succeeded but plan file was not created:', planFile)
        return NextResponse.json(
          { error: 'Plan file was not created despite successful plan command' },
          { status: 500 }
        )
      }
    }
    
    // Parse the plan output to extract statistics
    const planStats = parseTerraformPlan(result.output)
    
    return NextResponse.json({
      ...result,
      plan: planStats
    })
  } catch (error) {
    console.error('💥 Error running terraform plan:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json(
      { error: 'Failed to run terraform plan' },
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
    const fullCommand = `terraform ${command} ${args.join(' ')}`
    console.log('🚀 Executing command:', {
      command: fullCommand,
      workingDirectory,
      timestamp: new Date().toISOString()
    })
    
    const terraform = spawn('terraform', [command, ...args], {
      cwd: workingDirectory,
      stdio: ['pipe', 'pipe', 'pipe']
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
        error: error || undefined,
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

function parseTerraformPlan(output: string): {
  plannedChanges: number
  toAdd: number
  toChange: number
  toDestroy: number
  planOutput: string
} {
  const lines = output.split('\n')
  let toAdd = 0
  let toChange = 0
  let toDestroy = 0

  for (const line of lines) {
    if (line.includes('Plan:')) {
      const match = line.match(/Plan: (\d+) to add, (\d+) to change, (\d+) to destroy/)
      if (match) {
        toAdd = parseInt(match[1]) || 0
        toChange = parseInt(match[2]) || 0
        toDestroy = parseInt(match[3]) || 0
      }
    }
  }

  const plannedChanges = toAdd + toChange + toDestroy

  return {
    plannedChanges,
    toAdd,
    toChange,
    toDestroy,
    planOutput: output
  }
}
