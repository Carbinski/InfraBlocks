// Client-side OpenAI agent - calls API routes
import { getCanvasInfrastructureSummary } from './infrastructure-manager'

// Agent function definitions (for type checking)
export const agentFunctions = {
  createInfrastructure: {
    name: "create_infrastructure",
    description: "Help user design and deploy cloud infrastructure",
    parameters: {
      type: "object",
      properties: {
        infrastructureType: {
          type: "string",
          enum: ["web-app", "single-service", "api-gateway", "data-pipeline", "ml-infrastructure", "microservices", "serverless"],
          description: "Type of infrastructure to create"
        },
        requirements: {
          type: "string",
          description: "Specific requirements and constraints"
        }
      },
      required: ["infrastructureType"]
    }
  },
  analyzeArchitecture: {
    name: "analyze_architecture",
    description: "Analyze existing cloud architecture for improvements",
    parameters: {
      type: "object",
      properties: {
        analysisType: {
          type: "string",
          enum: ["performance", "security", "cost", "scalability"],
          description: "Type of analysis to perform"
        },
        currentSetup: {
          type: "string",
          description: "Description of current architecture"
        }
      },
      required: ["analysisType"]
    }
  },
  troubleshootIssues: {
    name: "troubleshoot_issues",
    description: "Help debug deployment or configuration problems",
    parameters: {
      type: "object",
      properties: {
        issueType: {
          type: "string",
          enum: ["deployment", "connectivity", "performance", "cost"],
          description: "Type of issue being experienced"
        },
        errorDetails: {
          type: "string",
          description: "Specific error messages or symptoms"
        }
      },
      required: ["issueType"]
    }
  },
  provideBestPractices: {
    name: "provide_best_practices",
    description: "Share cloud architecture best practices",
    parameters: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          enum: ["security", "cost-optimization", "high-availability", "performance"],
          description: "Best practice topic to cover"
        },
        experienceLevel: {
          type: "string",
          enum: ["beginner", "intermediate", "advanced"],
          description: "User's experience level"
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

