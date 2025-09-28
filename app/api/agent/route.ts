import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client server-side
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Agent function definitions
const agentFunctions = {
  createInfrastructure: {
    name: "create_infrastructure",
    description: "Help user design and deploy cloud infrastructure",
    parameters: {
      type: "object",
      properties: {
        infrastructureType: {
          type: "string",
          enum: ["web-app", "api-gateway", "data-pipeline", "ml-infrastructure", "microservices", "serverless"],
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

// Available functions mapping
const functionMap: Record<string, Function> = {
  create_infrastructure: handleCreateInfrastructure,
  analyze_architecture: handleAnalyzeArchitecture,
  troubleshoot_issues: handleTroubleshootIssues,
  provide_best_practices: handleProvideBestPractices
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API Route: Received agent request')
    console.log('🔍 DEBUG: Request method:', request.method)
    console.log('🔍 DEBUG: Request headers:', Object.fromEntries(request.headers.entries()))

    const body = await request.json()
    console.log('🔍 DEBUG: Raw request body:', JSON.stringify(body, null, 2))

    const { message, conversationHistory, canvasContext } = body

    console.log('📝 API Route: Message:', message)
    console.log('📚 API Route: Conversation history length:', conversationHistory?.length || 0)
    console.log('🎨 API Route: Canvas context:', canvasContext)
    console.log('🔍 DEBUG: Conversation history:', JSON.stringify(conversationHistory, null, 2))

    if (!message) {
      console.error('❌ API Route: Message is required')
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const messages = [
      {
        role: "system",
        content: `You are an expert cloud infrastructure consultant and DevOps engineer. You help users with:

1. Creating and deploying cloud infrastructure (AWS, GCP, Azure)
2. Analyzing existing architectures for improvements
3. Troubleshooting deployment and configuration issues
4. Sharing best practices for cloud architecture
5. NEVER output any character like * or # or anything else. Just output the text.

CURRENT CANVAS STATE: ${canvasContext || 'No canvas context available'}

You should be helpful, technical, and provide actionable advice. When users ask questions, analyze their intent and call the appropriate function to provide structured help.

CRITICAL: Always call functions when users mention creating, building, deploying, or designing infrastructure. Never respond with text when a function call is appropriate.

INFRASTRUCTURE EXECUTION: When you call create_infrastructure, the infrastructure is IMMEDIATELY created and added to the user's canvas. Do NOT ask for confirmation or say you haven't created it yet. Act as if the infrastructure has been successfully created when you return the createInfrastructure data.

RESTRICTED SERVICE LIMITATION: For this phase of the application, you can ONLY use these 4 AWS services:
- DynamoDB (database)
- S3 (storage)
- API Gateway (API management)
- SQS (message queuing)

Do NOT use any other AWS services like EC2, Lambda, VPC, RDS, CloudWatch, etc. Only use the 4 services listed above.

WHY THESE RESTRICTIONS: CodeBlocks is still in development, so we're focusing on a core set of serverless services that work well together. Explain to the user that CodeBlocks will add more services in the future but he can help with questions in the meantime

Available functions:
- create_infrastructure: Call this when users want to create, build, deploy, or design any cloud infrastructure (web apps, data pipelines, APIs, etc.) - THIS IMMEDIATELY CREATES AND ADDS TO CANVAS
- analyze_architecture: Call this when users want to analyze or review existing cloud setups
- troubleshoot_issues: Call this when users have problems with deployments or connectivity
- provide_best_practices: Call this when users ask for advice or best practices

IMPORTANT: When users mention infrastructure creation with complexity levels like "basic setup", "production ready", "enterprise scale", or "custom configuration", call create_infrastructure with both the infrastructure type and complexity level specified in the requirements.

For individual service requests, IMMEDIATELY call create_infrastructure without asking for confirmation. For example:
- "Create a basic web app" → call create_infrastructure with infrastructureType: "web-app" and requirements: "basic setup"
- "Add DynamoDB" → IMMEDIATELY call create_infrastructure with infrastructureType: "single-service" and requirements: "add DynamoDB"
- "Create one dynamo" → IMMEDIATELY call create_infrastructure with infrastructureType: "single-service" and requirements: "add DynamoDB"
- "Just add a dynamo" → IMMEDIATELY call create_infrastructure with infrastructureType: "single-service" and requirements: "add DynamoDB"
- "Add S3 bucket" → IMMEDIATELY call create_infrastructure with infrastructureType: "single-service" and requirements: "add S3 bucket"
- "I need a production data pipeline" → call create_infrastructure with infrastructureType: "data-pipeline" and requirements: "production ready"

When users ask to "add", "create", or mention specific services like DynamoDB, S3, API Gateway, SQS - IMMEDIATELY call create_infrastructure with single-service. Do NOT show multiple choice options for single service requests.

Always call functions when users express intent to create or work with infrastructure. The infrastructure appears on their canvas immediately when you call the function.`
      },
      ...(conversationHistory || []).slice(-10), // Keep last 10 messages for context
      {
        role: "user",
        content: message
      }
    ]

    console.log('🤖 API Route: Calling OpenAI API...')
    console.log('🔍 DEBUG: Messages being sent:', JSON.stringify(messages, null, 2))
    console.log('🔍 DEBUG: Functions available:', Object.keys(agentFunctions))

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: messages,
      tools: Object.values(agentFunctions).map(func => ({ type: "function", function: func })),
      tool_choice: "auto",
      max_tokens: 1000,
      temperature: 0.7
    })

    console.log('✅ API Route: OpenAI response received')
    console.log('🔍 DEBUG: Full OpenAI response:', JSON.stringify(response, null, 2))

    const choice = response.choices[0]
    const messageResponse = choice.message
    console.log('🎯 API Route: Response type:', messageResponse.tool_calls ? 'tool_calls' : 'text')
    console.log('🔍 DEBUG: Message response content:', messageResponse.content)
    console.log('🔍 DEBUG: Tool calls details:', messageResponse.tool_calls)

    // Check if the model wants to call a tool
    if (messageResponse.tool_calls && messageResponse.tool_calls.length > 0) {
      const toolCall = messageResponse.tool_calls[0]
      const functionName = toolCall.function.name
      const functionArgs = JSON.parse(toolCall.function.arguments || '{}')
      console.log('🔧 API Route: Tool call:', functionName, functionArgs)
      console.log('🔍 DEBUG: Function args parsed:', functionArgs)

      // Call the appropriate handler function
      const handler = functionMap[functionName]
      if (handler) {
        console.log('⚙️ API Route: Executing handler:', functionName)
        console.log('🔍 DEBUG: Handler function found:', typeof handler)
        const result = await handler(functionArgs)
        console.log('🎉 API Route: Handler result:', JSON.stringify(result, null, 2))
        console.log('🔍 DEBUG: Returning handler result')
        return NextResponse.json(result)
      } else {
        console.error('❌ API Route: No handler found for:', functionName)
        console.log('🔍 DEBUG: Available handlers:', Object.keys(functionMap))
      }
    }

    // Return regular response if no function call
    console.log('💬 API Route: Returning text response')
    const textResponse = {
      type: 'text',
      content: messageResponse.content || "I'm here to help with your cloud infrastructure needs. What would you like to work on?"
    }
    console.log('🔍 DEBUG: Text response:', JSON.stringify(textResponse, null, 2))
    return NextResponse.json(textResponse)
  } catch (error) {
    console.error('❌ OpenAI agent error:', error)
    console.log('🔍 DEBUG: Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.log('🔍 DEBUG: Error type:', typeof error)
    return NextResponse.json({
      error: 'Failed to process message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Handler functions
async function handleCreateInfrastructure(args: any) {
  console.log('🔧 Handler: handleCreateInfrastructure called with args:', args)
  const { infrastructureType, requirements } = args
  console.log('🔍 DEBUG: Infrastructure type:', infrastructureType, 'Requirements:', requirements)

  const infrastructureTypes = {
    "web-app": "Web Application",
    "single-service": "Single Service",
    "api-gateway": "API Gateway + Lambda Functions",
    "data-pipeline": "Data Pipeline (ETL/ELT)",
    "ml-infrastructure": "Machine Learning Infrastructure",
    "microservices": "Microservices Architecture",
    "serverless": "Serverless Application"
  }

  const type = infrastructureTypes[infrastructureType as keyof typeof infrastructureTypes] || infrastructureType

  // Check if this is a single service request that should be handled directly
  if (infrastructureType === "single-service" || (requirements && (requirements.toLowerCase().includes('add ') || requirements.toLowerCase().includes('create ')))) {
    console.log('⚡ Handler: Detected single service request, creating directly')
    return handleInfrastructureDetails("Single Service", requirements || "", requirements)
  }

  // Check if requirements already specify a complexity level
  const complexityPatterns = {
    basic: /basic|simple/i,
    production: /production|high.availability|monitoring/i,
    enterprise: /enterprise|multi.region|advanced.security/i,
    custom: /custom|specific/i
  }

  let detectedComplexity: string | null = null
  if (requirements) {
    console.log('🔍 Handler: Checking requirements for complexity:', requirements)
    for (const [level, pattern] of Object.entries(complexityPatterns)) {
      console.log('🔍 Handler: Testing pattern:', level, 'against:', requirements, 'result:', pattern.test(requirements))
      if (pattern.test(requirements)) {
        detectedComplexity = level
        console.log('🎯 Handler: Detected complexity level:', level, 'from requirements:', requirements)
        break
      }
    }
  } else {
    console.log('🔍 Handler: No requirements provided')
  }

  // If complexity is already specified in requirements, skip the multiple choice
  if (detectedComplexity) {
    const complexityMap = {
      basic: "Serverless Setup (API Gateway + DynamoDB)",
      production: "Production Serverless (High availability, monitoring)",
      enterprise: "Enterprise Serverless (Multi-region, advanced security)",
      custom: "Custom Serverless Configuration (Specific requirements)"
    }

    const complexityLabel = complexityMap[detectedComplexity as keyof typeof complexityMap]
    console.log('⚡ Handler: Skipping multiple choice, creating infrastructure directly with:', type, complexityLabel)
    return handleInfrastructureDetails(type, complexityLabel, requirements)
  }

  // Return multiple choice for infrastructure type selection
  return {
    type: 'multiple_choice',
    content: `What type of ${type.toLowerCase()} infrastructure would you like to create?${requirements ? `\n\nRequirements: ${requirements}` : ''}`,
    choices: [
      "Serverless Setup (API Gateway + DynamoDB)",
      "Production Serverless (High availability, monitoring)",
      "Enterprise Serverless (Multi-region, advanced security)",
      "Custom Serverless Configuration (Specific requirements)"
    ],
    onChoice: (choice: string) => handleInfrastructureDetails(type, choice, requirements)
  }
}

async function handleAnalyzeArchitecture(args: any) {
  const { analysisType, currentSetup } = args

  return {
    type: 'text',
    content: `I'll help you analyze your architecture for ${analysisType} improvements.${currentSetup ? `\n\nCurrent setup: ${currentSetup}` : ''}

Based on your requirements, here are the key areas I recommend focusing on:

**1. Resource Assessment**
• Review current resource utilization and sizing
• Identify over-provisioned or under-utilized instances
• Check for single points of failure

**2. Performance Analysis**
• Network latency and throughput analysis
• Database query optimization opportunities
• Application response time monitoring

**3. Cost Optimization**
• Reserved instance and savings plan opportunities
• Storage tier optimization
• Right-sizing recommendations

**4. Security Review**
• IAM policy analysis and least privilege
• Network security group configurations
• Data encryption and access controls

Would you like me to dive deeper into any of these areas or help you implement specific improvements?`
  }
}

async function handleTroubleshootIssues(args: any) {
  const { issueType, errorDetails } = args

  let troubleshootingGuide = ""

  switch (issueType) {
    case "deployment":
      troubleshootingGuide = `**Deployment Troubleshooting Guide**

**Common Issues:**
• Terraform state conflicts
• Provider authentication problems
• Resource dependency errors
• IAM permission issues

**Debugging Steps:**
1. Check CloudWatch logs for detailed error messages
2. Run \`terraform validate\` to check syntax
3. Use \`terraform plan\` to preview changes
4. Verify IAM permissions and roles

**Quick Fixes:**
• Clear Terraform state if corrupted
• Update provider versions
• Check for resource limits${errorDetails ? `\n\nSpecific error: ${errorDetails}` : ''}

What specific error message are you seeing?`
      break

    case "connectivity":
      troubleshootingGuide = `**Network Connectivity Troubleshooting**

**Common Issues:**
• Security group misconfigurations
• Routing table problems
• DNS resolution failures
• Load balancer health check issues

**Debugging Steps:**
1. Test connectivity with telnet/nc commands
2. Check security group inbound/outbound rules
3. Verify routing table configurations
4. Test DNS resolution with nslookup

**Network Tools:**
• Use VPC flow logs to trace connections
• Check NACL rules for blocking
• Verify internet gateway configuration${errorDetails ? `\n\nSpecific issue: ${errorDetails}` : ''}

Can you describe the connectivity problem in more detail?`
      break

    case "performance":
      troubleshootingGuide = `**Performance Troubleshooting Guide**

**Common Bottlenecks:**
• CPU/memory exhaustion
• Disk I/O limitations
• Network bandwidth constraints
• Database connection limits

**Analysis Steps:**
1. Check CloudWatch metrics for resource utilization
2. Review application logs for error patterns
3. Monitor database query performance
4. Check network latency and throughput

**Optimization Strategies:**
• Right-size instances based on usage patterns
• Implement auto-scaling for variable loads
• Use caching for frequently accessed data
• Optimize database queries and indexing${errorDetails ? `\n\nPerformance issue: ${errorDetails}` : ''}

What specific performance problems are you experiencing?`
      break

    case "cost":
      troubleshootingGuide = `**Cost Optimization Troubleshooting**

**Common Cost Issues:**
• Unexpected data transfer charges
• Over-provisioned resources
• Unused or zombie resources
• Inefficient storage usage

**Cost Analysis:**
1. Review Cost Explorer for spending patterns
2. Check for unused resources to terminate
3. Analyze data transfer and storage costs
4. Review reserved instance coverage

**Optimization Actions:**
• Implement auto-scaling to match demand
• Use spot instances for fault-tolerant workloads
• Optimize storage tiers and lifecycle policies
• Set up billing alerts and budgets${errorDetails ? `\n\nCost concern: ${errorDetails}` : ''}

What specific cost issues are you facing?`
      break
  }

  return {
    type: 'text',
    content: troubleshootingGuide
  }
}

async function handleProvideBestPractices(args: any) {
  const { topic, experienceLevel } = args

  let bestPractices = ""

  switch (topic) {
    case "security":
      bestPractices = `🔒 **Security Best Practices**

**1. Identity & Access Management**
• Implement least privilege principle
• Use IAM roles instead of access keys
• Enable multi-factor authentication
• Regular access key rotation

**2. Network Security**
• Use security groups to control traffic
• Implement private subnets for sensitive resources
• Use AWS WAF for web application protection
• Enable VPC flow logs for monitoring

**3. Data Protection**
• Encrypt data at rest and in transit
• Use AWS KMS for key management
• Implement proper backup strategies
• Regular security assessments

**4. Monitoring & Compliance**
• Enable CloudTrail for API logging
• Set up GuardDuty for threat detection
• Use Security Hub for compliance
• Implement incident response procedures`
      break

    case "cost-optimization":
      bestPractices = `💰 **Cost Optimization Best Practices**

**1. Right Sizing**
• Use AWS Compute Optimizer recommendations
• Monitor and adjust instance sizes
• Implement auto-scaling for variable loads
• Use appropriate storage classes

**2. Reserved Instances & Savings Plans**
• Analyze usage patterns for RI opportunities
• Use Savings Plans for flexible compute
• Purchase RIs for predictable workloads
• Monitor coverage and utilization

**3. Storage Optimization**
• Use S3 lifecycle policies
• Compress data before storage
• Delete unused snapshots and volumes
• Use appropriate storage tiers

**4. Architectural Optimization**
• Use serverless for variable workloads
• Implement caching strategies
• Optimize data transfer patterns
• Regular cost review and optimization`
      break

    case "high-availability":
      bestPractices = `⚡ **High Availability Best Practices**

**1. Multi-AZ Architecture**
• Deploy across multiple Availability Zones
• Use ELB for traffic distribution
• Configure RDS with Multi-AZ failover
• Implement cross-region replication

**2. Auto Scaling & Load Balancing**
• Use Auto Scaling Groups for EC2
• Configure health checks for automatic failover
• Implement load balancer health monitoring
• Use Route 53 for DNS failover

**3. Data Backup & Recovery**
• Enable automated backups
• Test disaster recovery procedures
• Use S3 cross-region replication
• Implement regular snapshot schedules

**4. Monitoring & Alerting**
• Set up comprehensive monitoring
• Implement alerting for key metrics
• Use distributed tracing
• Create incident response runbooks`
      break

    case "performance":
      bestPractices = `📈 **Performance Optimization Best Practices**

**1. Compute Optimization**
• Right-size instances based on workload
• Use auto-scaling for variable demand
• Implement load balancing
• Choose appropriate instance types

**2. Database Performance**
• Optimize queries and implement indexing
• Use read replicas for read-heavy workloads
• Implement connection pooling
• Monitor query performance

**3. Network Performance**
• Use CloudFront for global content delivery
• Implement caching strategies
• Optimize network architecture
• Monitor latency and throughput

**4. Application Performance**
• Implement caching at multiple layers
• Use CDN for static assets
• Optimize database connections
• Monitor application performance metrics`
      break
  }

  if (experienceLevel === "beginner") {
    bestPractices += "\n\n**Beginner Tips:** Start with basic monitoring and implement one optimization at a time."
  } else if (experienceLevel === "advanced") {
    bestPractices += "\n\n**Advanced Tips:** Consider implementing automated optimization and predictive scaling."
  }

  return {
    type: 'text',
    content: bestPractices
  }
}

function handleInfrastructureDetails(type: string, complexity: string, requirements?: string) {
  // Return detailed checklist based on infrastructure type and complexity
  const checklist = getInfrastructureChecklist(type, complexity)
  const infrastructure = generateInfrastructureComponents(type, complexity)

  return {
    type: 'todolist',
    content: `I've successfully created your ${complexity.toLowerCase()} for ${type}. The infrastructure has been added to your canvas with ${infrastructure.length} connected services. Here's your deployment checklist:`,
    items: checklist,
    createInfrastructure: infrastructure
  }
}

function generateInfrastructureComponents(type: string, complexity: string): any[] {
  // Generate infrastructure components based on type
  const components: any[] = []

  if (type === "Web Application") {
    // Full web application stack
    components.push(
      {
        id: "api-gateway",
        name: "API Gateway",
        provider: "aws",
        service: "api_gateway",
        position: { x: 100, y: 100 },
        config: {
          name: "web-api-gateway",
          description: "API Gateway for web application"
        }
      },
      {
        id: "sqs-queue",
        name: "Message Queue",
        provider: "aws",
        service: "sqs",
        position: { x: 300, y: 100 },
        config: {
          name: "web-app-queue",
          delay_seconds: 0,
          max_message_size: 262144,
          message_retention_period: 345600,
          receive_message_wait_time_seconds: 0,
          visibility_timeout_seconds: 30
        }
      },
      {
        id: "s3-bucket",
        name: "Storage Bucket",
        provider: "aws",
        service: "s3",
        position: { x: 500, y: 100 },
        config: {
          name: "web-app-storage-bucket",
          versioning: true,
          public_read: false
        }
      },
      {
        id: "dynamodb-table",
        name: "Database Table",
        provider: "aws",
        service: "dynamodb",
        position: { x: 700, y: 100 },
        config: {
          table_name: "web-app-data",
          hash_key: "id",
          read_capacity: 5,
          write_capacity: 5
        }
      }
    )
  } else if (type === "Single Service") {
    // Handle individual service requests
    const lowerRequirements = complexity.toLowerCase()

    if (lowerRequirements.includes('dynamodb') || lowerRequirements.includes('dynamo')) {
      components.push({
        id: "dynamodb-table-" + Date.now(),
        name: "DynamoDB Table",
        provider: "aws",
        service: "dynamodb",
        position: { x: Math.random() * 400 + 100, y: Math.random() * 200 + 100 },
        config: {
          table_name: "my-table",
          hash_key: "id",
          read_capacity: 5,
          write_capacity: 5
        }
      })
    } else if (lowerRequirements.includes('s3')) {
      components.push({
        id: "s3-bucket-" + Date.now(),
        name: "S3 Bucket",
        provider: "aws",
        service: "s3",
        position: { x: Math.random() * 400 + 100, y: Math.random() * 200 + 100 },
        config: {
          name: "my-bucket-" + Math.random().toString(36).substring(2, 8),
          versioning: true,
          public_read: false
        }
      })
    } else if (lowerRequirements.includes('api gateway') || lowerRequirements.includes('api-gateway')) {
      components.push({
        id: "api-gateway-" + Date.now(),
        name: "API Gateway",
        provider: "aws",
        service: "api_gateway",
        position: { x: Math.random() * 400 + 100, y: Math.random() * 200 + 100 },
        config: {
          name: "my-api-gateway",
          description: "API Gateway service"
        }
      })
    } else if (lowerRequirements.includes('sqs')) {
      components.push({
        id: "sqs-queue-" + Date.now(),
        name: "SQS Queue",
        provider: "aws",
        service: "sqs",
        position: { x: Math.random() * 400 + 100, y: Math.random() * 200 + 100 },
        config: {
          name: "my-queue",
          delay_seconds: 0,
          max_message_size: 262144,
          message_retention_period: 345600,
          receive_message_wait_time_seconds: 0,
          visibility_timeout_seconds: 30
        }
      })
    }
  } else if (type === "Data Pipeline (ETL/ELT)") {
    components.push(
      {
        id: "s3-bucket",
        name: "Data Lake",
        provider: "aws",
        service: "s3",
        position: { x: 100, y: 100 },
        config: { name: "data-lake-bucket" }
      },
      {
        id: "lambda-etl",
        name: "ETL Function",
        provider: "aws",
        service: "lambda",
        position: { x: 300, y: 100 },
        config: { runtime: "python3.9", memory: 512 }
      },
      {
        id: "step-functions",
        name: "Pipeline Orchestrator",
        provider: "aws",
        service: "step_functions",
        position: { x: 500, y: 100 },
        config: { type: "STANDARD" }
      },
      {
        id: "redshift-cluster",
        name: "Data Warehouse",
        provider: "aws",
        service: "rds",
        position: { x: 700, y: 100 },
        config: { engine: "redshift", node_type: "dc2.large", cluster_type: "single-node" }
      }
    )
  } else if (type === "API Gateway + Lambda Functions") {
    components.push(
      {
        id: "api-gateway",
        name: "API Gateway",
        provider: "aws",
        service: "api_gateway",
        position: { x: 100, y: 100 },
        config: { protocol_type: "HTTP" }
      },
      {
        id: "lambda-function",
        name: "API Function",
        provider: "aws",
        service: "lambda",
        position: { x: 300, y: 100 },
        config: { runtime: "nodejs18.x", memory: 256 }
      },
      {
        id: "dynamodb-table",
        name: "API Data",
        provider: "aws",
        service: "dynamodb",
        position: { x: 500, y: 100 },
        config: { billing_mode: "PAY_PER_REQUEST" }
      }
    )
  }

  return components
}

function getInfrastructureChecklist(type: string, complexity: string): any[] {
  const checklists: Record<string, any[]> = {
    "Single Service": [
      {
        text: "Service added to canvas",
        description: "The requested service has been added to your canvas",
        done: true
      },
      {
        text: "Review service configuration",
        description: "Check the service settings and adjust as needed",
        done: false
      },
      {
        text: "Connect to other services",
        description: "Consider connecting this service to your existing infrastructure",
        done: false
      }
    ],
    "Web Application": [
      {
        text: "Review service connections",
        description: "Check that API Gateway, SQS, S3, and DynamoDB are properly connected on the canvas",
        done: false
      },
      {
        text: "Plan your data model",
        description: "Design how you'll use DynamoDB tables for your application data",
        done: false
      },
      {
        text: "Design API endpoints",
        description: "Plan the REST API structure you'll implement with API Gateway",
        done: false
      },
      {
        text: "Configure S3 bucket policies",
        description: "Plan security and access policies for your S3 storage bucket",
        done: false
      },
      {
        text: "Set up message processing",
        description: "Design how SQS will handle async operations and decoupling",
        done: false
      },
      {
        text: "Document your architecture",
        description: "Save or export your current infrastructure design for future reference",
        done: false
      }
    ],
    "Data Pipeline (ETL/ELT)": [
      {
        text: "Set up data sources",
        description: "Configure connections to source databases, APIs, or file systems",
        done: false
      },
      {
        text: "Design data transformation logic",
        description: "Define ETL/ELT processes, data cleansing, and transformation rules",
        done: false
      },
      {
        text: "Set up data warehouse/lake",
        description: "Configure S3, Redshift, or BigQuery for data storage",
        done: false
      },
      {
        text: "Implement orchestration",
        description: "Set up Apache Airflow, AWS Step Functions, or similar for pipeline scheduling",
        done: false
      },
      {
        text: "Configure monitoring and alerting",
        description: "Set up data quality checks, pipeline monitoring, and failure notifications",
        done: false
      },
      {
        text: "Implement data security",
        description: "Set up encryption, access controls, and data governance policies",
        done: false
      }
    ],
    "API Gateway + Lambda Functions": [
      {
        text: "Design API endpoints",
        description: "Define REST/GraphQL API structure and endpoints",
        done: false
      },
      {
        text: "Set up API Gateway",
        description: "Configure AWS API Gateway or equivalent with proper routing",
        done: false
      },
      {
        text: "Implement Lambda functions",
        description: "Create serverless functions for business logic",
        done: false
      },
      {
        text: "Configure authentication",
        description: "Set up JWT, OAuth, or API keys for secure access",
        done: false
      },
      {
        text: "Set up monitoring",
        description: "Configure CloudWatch, X-Ray, and logging for API performance",
        done: false
      },
      {
        text: "Implement rate limiting",
        description: "Configure throttling and rate limiting to prevent abuse",
        done: false
      }
    ],
    "Machine Learning Infrastructure": [
      {
        text: "Set up compute resources",
        description: "Configure GPU instances or serverless ML compute",
        done: false
      },
      {
        text: "Configure data storage",
        description: "Set up S3 buckets or data lakes for training data",
        done: false
      },
      {
        text: "Set up ML platforms",
        description: "Configure SageMaker, Vertex AI, or custom ML environments",
        done: false
      },
      {
        text: "Implement model versioning",
        description: "Set up model registry and version control",
        done: false
      },
      {
        text: "Configure monitoring",
        description: "Set up model performance monitoring and drift detection",
        done: false
      },
      {
        text: "Set up deployment pipeline",
        description: "Configure CI/CD for model training and deployment",
        done: false
      }
    ],
    "Microservices Architecture": [
      {
        text: "Design service boundaries",
        description: "Define microservice domains and responsibilities",
        done: false
      },
      {
        text: "Set up service registry",
        description: "Configure service discovery and registration",
        done: false
      },
      {
        text: "Implement API gateway",
        description: "Set up centralized API management and routing",
        done: false
      },
      {
        text: "Configure container orchestration",
        description: "Set up Kubernetes, ECS, or equivalent orchestration",
        done: false
      },
      {
        text: "Implement service mesh",
        description: "Configure Istio, Linkerd, or service mesh for observability",
        done: false
      },
      {
        text: "Set up centralized logging",
        description: "Configure ELK stack or CloudWatch for distributed logging",
        done: false
      }
    ],
    "Serverless Application": [
      {
        text: "Design function architecture",
        description: "Define serverless functions and event triggers",
        done: false
      },
      {
        text: "Set up function runtime",
        description: "Configure Lambda, Cloud Functions, or Azure Functions",
        done: false
      },
      {
        text: "Configure event sources",
        description: "Set up API Gateway, S3 triggers, or event bridges",
        done: false
      },
      {
        text: "Implement state management",
        description: "Configure DynamoDB, Redis, or other data stores",
        done: false
      },
      {
        text: "Set up monitoring",
        description: "Configure CloudWatch, Stackdriver, or function monitoring",
        done: false
      },
      {
        text: "Implement security",
        description: "Configure IAM roles, VPC, and function-level security",
        done: false
      }
    ]
  }

  return checklists[type] || [
    { text: "Set up cloud provider credentials", description: "Configure access", done: false },
    { text: "Design architecture", description: "Plan your infrastructure", done: false },
    { text: "Deploy resources", description: "Create your infrastructure", done: false },
    { text: "Test deployment", description: "Verify everything works", done: false }
  ]
}
