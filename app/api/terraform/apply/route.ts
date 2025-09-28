import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workingDirectory, planFile, autoApprove } = body
    
    console.log('🚀 Terraform Apply API called:', {
      workingDirectory,
      planFile,
      autoApprove,
      timestamp: new Date().toISOString()
    })

    if (!workingDirectory) {
      console.error('❌ Missing working directory')
      return NextResponse.json(
        { error: 'Working directory is required' },
        { status: 400 }
      )
    }

    const args = []
    if (planFile) {
      // Check if plan file exists
      const planFileExists = existsSync(planFile)
      console.log('📁 Plan file check:', {
        planFile,
        exists: planFileExists
      })
      
      if (planFileExists) {
        args.push(planFile)
        console.log('📋 Using plan file:', planFile)
      } else {
        console.warn('⚠️ Plan file does not exist, falling back to auto-approve mode')
        if (autoApprove) {
          args.push('-auto-approve')
          console.log('⚡ Auto-approve enabled (fallback)')
        } else {
          return NextResponse.json(
            { error: `Plan file not found: ${planFile}. Please run terraform plan first or enable auto-approve.` },
            { status: 400 }
          )
        }
      }
    } else if (autoApprove) {
      args.push('-auto-approve')
      console.log('⚡ Auto-approve enabled')
    }

    // Check if working directory exists
    if (!existsSync(workingDirectory)) {
      console.error('❌ Working directory does not exist:', workingDirectory)
      return NextResponse.json(
        { error: `Working directory does not exist: ${workingDirectory}` },
        { status: 400 }
      )
    }

    console.log('🚀 Executing terraform apply command with args:', args)
    const result = await executeTerraformCommand('apply', args, workingDirectory)
    
    console.log('📊 Terraform apply result:', {
      success: result.success,
      exitCode: result.exitCode,
      outputLength: result.output?.length || 0,
      errorLength: result.error?.length || 0
    })
    
    if (result.output) {
      console.log('📋 Terraform apply output:', result.output)
    }
    if (result.error) {
      console.warn('⚠️ Terraform apply error:', result.error)
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('💥 Error running terraform apply:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json(
      { error: 'Failed to run terraform apply' },
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
