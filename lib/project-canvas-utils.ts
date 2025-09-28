import type { Node, Edge } from '@xyflow/react'

export interface Project {
  id: string
  name: string
  description?: string
  provider?: "aws" | "gcp" | "azure"
  architectures: number
  lastModified: string
  status: "active" | "archived"
  createdAt: string
  canvasState?: {
    nodes: Node[]
    edges: Edge[]
    lastSaved: string
  }
}

export class ProjectCanvasUtils {
  private static readonly STORAGE_KEY = 'infrastructure-designer-projects'

  /**
   * Save canvas state to a project
   */
  static saveCanvasState(projectId: string, nodes: Node[], edges: Edge[]): void {
    try {
      const projects = this.getAllProjects()
      const projectIndex = projects.findIndex(p => p.id === projectId)
      
      if (projectIndex === -1) {
        console.warn(`Project not found: ${projectId}`)
        return
      }

      const canvasState = {
        nodes: JSON.parse(JSON.stringify(nodes)), // Deep clone
        edges: JSON.parse(JSON.stringify(edges)), // Deep clone
        lastSaved: new Date().toISOString()
      }

      projects[projectIndex] = {
        ...projects[projectIndex],
        canvasState,
        lastModified: "Just now",
        architectures: nodes.length
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects))
      console.log(`Canvas state saved for project: ${projects[projectIndex].name}`)
    } catch (error) {
      console.error('Failed to save canvas state:', error)
    }
  }

  /**
   * Load canvas state from a project
   */
  static loadCanvasState(projectId: string): { nodes: Node[], edges: Edge[] } | null {
    try {
      const projects = this.getAllProjects()
      const project = projects.find(p => p.id === projectId)
      
      if (!project || !project.canvasState) {
        return null
      }

      return {
        nodes: project.canvasState.nodes,
        edges: project.canvasState.edges
      }
    } catch (error) {
      console.error('Failed to load canvas state:', error)
      return null
    }
  }

  /**
   * Check if project has unsaved changes
   */
  static hasUnsavedChanges(projectId: string, currentNodes: Node[], currentEdges: Edge[]): boolean {
    const savedState = this.loadCanvasState(projectId)
    if (!savedState) return true // If no saved state, consider it unsaved

    // Simple comparison - in production, you might want more sophisticated diffing
    return JSON.stringify(savedState.nodes) !== JSON.stringify(currentNodes) ||
           JSON.stringify(savedState.edges) !== JSON.stringify(currentEdges)
  }

  /**
   * Get all projects from localStorage
   */
  private static getAllProjects(): Project[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load projects:', error)
      return []
    }
  }
}
