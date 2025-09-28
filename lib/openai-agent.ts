// Client-side OpenAI agent - calls API routes
import { getCanvasInfrastructureSummary } from './infrastructure-manager'

// Agent function definitions (for type checking)
export const agentFunctions = {
  createInfrastructure: {
    name: "create_infrastructure",
    description: "Create and deploy cloud infrastructure based on user requirements",
    parameters: {
      type: "object",
      properties: {
        infrastructureType: {
          type: "string",
          description: "Type of infrastructure to create (e.g., web-app, single-service, data-pipeline, api, microservices, etc.)"
        },
        requirements: {
          type: "string",
          description: "Detailed requirements and specifications for the infrastructure"
        }
      },
      required: ["infrastructureType", "requirements"]
    }
  },
  analyzeArchitecture: {
    name: "analyze_architecture", 
    description: "Analyze and provide insights on cloud architecture",
    parameters: {
      type: "object",
      properties: {
        analysisType: {
          type: "string",
          description: "Type of analysis to perform (e.g., performance, security, cost, scalability, general review)"
        },
        currentSetup: {
          type: "string",
          description: "Description of current architecture or specific areas to analyze"
        }
      },
      required: ["analysisType"]
    }
  },
  troubleshootIssues: {
    name: "troubleshoot_issues",
    description: "Help debug and resolve infrastructure problems",
    parameters: {
      type: "object",
      properties: {
        issueType: {
          type: "string", 
          description: "Type of issue being experienced (e.g., deployment, connectivity, performance, cost, configuration)"
        },
        errorDetails: {
          type: "string",
          description: "Specific error messages, symptoms, or problem description"
        }
      },
      required: ["issueType"]
    }
  },
  provideBestPractices: {
    name: "provide_best_practices",
    description: "Share relevant cloud architecture best practices and recommendations",
    parameters: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "Best practice topic or area of interest (e.g., security, cost-optimization, high-availability, performance, monitoring)"
        },
        context: {
          type: "string",
          description: "Additional context about the user's situation or specific requirements"
        }
      },
      required: ["topic"]
    }
  }
}

// Note: Handler functions are now in the API route

// Main agent function - calls API route
export async function processUserMessage(message: string, conversationHistory: any[] = []) {
  try {
    console.log('🌐 Client: Making API request to /api/agent')

    // Get current canvas context
    const canvasContext = getCanvasInfrastructureSummary()
    console.log('🎨 Client: Canvas context:', canvasContext)
    console.log('📤 Client: Sending:', { message, conversationHistoryLength: conversationHistory?.length || 0, canvasContext })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const response = await fetch('/api/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversationHistory,
        canvasContext
      }),
      signal: controller.signal
    })

    console.log('📥 Client: Response status:', response.status)
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Client: API error:', response.status, errorText)
      throw new Error(`API error: ${response.status}`)
    }

    const result = await response.json()
    console.log('✅ Client: API response received:', result)
    return result
  } catch (error) {
    console.error('💥 Client: OpenAI agent error:', error)
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        type: 'text',
        content: "I'm taking longer than expected to process your request. Please try again with a simpler question."
      }
    }
    return {
      type: 'text',
      content: "I apologize, but I'm having trouble processing your request right now. Please try again or let me know how else I can help with your cloud infrastructure needs."
    }
  }
}

