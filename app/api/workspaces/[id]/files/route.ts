import { promises as fs } from 'fs'
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { workspaces } from '../../route'

/**
 * Get workspace files
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

    try {
      const files = await fs.readdir(workspace.workingDirectory)
      const fileContents: Record<string, string> = {}

      for (const file of files) {
        if (file.endsWith('.tf') || file.endsWith('.json')) {
          const content = await fs.readFile(
            path.join(workspace.workingDirectory, file),
            'utf8'
          )
          fileContents[file] = content
        }
      }

      return NextResponse.json({ files: fileContents })
    } catch (error) {
      console.error(`Failed to read workspace files for ${params.id}:`, error)
      return NextResponse.json({ files: {} })
    }
  } catch (error) {
    console.error('Error getting workspace files:', error)
    return NextResponse.json(
      { error: 'Failed to get workspace files' },
      { status: 500 }
    )
  }
}
