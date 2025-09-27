import { promises as fs } from 'fs'
import { NextRequest, NextResponse } from 'next/server'
import { workspaces } from '../route'

/**
 * Get a specific workspace
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspace = workspaces.get(params.id)
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ workspace })
  } catch (error) {
    console.error('Error getting workspace:', error)
    return NextResponse.json(
      { error: 'Failed to get workspace' },
      { status: 500 }
    )
  }
}

/**
 * Update workspace status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body

    const workspace = workspaces.get(params.id)
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    workspace.status = status
    if (status === 'active') {
      workspace.lastDeployed = new Date().toISOString()
    }

    workspaces.set(params.id, workspace)

    return NextResponse.json({ workspace })
  } catch (error) {
    console.error('Error updating workspace:', error)
    return NextResponse.json(
      { error: 'Failed to update workspace' },
      { status: 500 }
    )
  }
}

/**
 * Delete a workspace
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspace = workspaces.get(params.id)
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Delete workspace directory
    try {
      await fs.rm(workspace.workingDirectory, { recursive: true, force: true })
    } catch (error) {
      console.error(`Failed to delete workspace directory ${workspace.workingDirectory}:`, error)
    }

    workspaces.delete(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workspace:', error)
    return NextResponse.json(
      { error: 'Failed to delete workspace' },
      { status: 500 }
    )
  }
}
