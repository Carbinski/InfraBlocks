export interface ConnectionRule {
  sourceType: string
  targetType: string
  relationship: string
  description: string
  bidirectional?: boolean
  required?: boolean
}

export const connectionRules: Record<string, ConnectionRule[]> = {
  aws: [
    {
      sourceType: "ec2",
      targetType: "vpc",
      relationship: "depends_on",
      description: "EC2 instances must be deployed within a VPC",
      required: true,
    },
    {
      sourceType: "ec2",
      targetType: "s3",
      relationship: "accesses",
      description: "EC2 can read/write to S3 buckets",
    },
    {
      sourceType: "ec2",
      targetType: "rds",
      relationship: "connects_to",
      description: "EC2 connects to RDS database",
    },
    {
      sourceType: "alb",
      targetType: "ec2",
      relationship: "load_balances",
      description: "Load balancer distributes traffic to EC2 instances",
    },
    {
      sourceType: "alb",
      targetType: "vpc",
      relationship: "depends_on",
      description: "Load balancer requires VPC",
      required: true,
    },
    {
      sourceType: "lambda",
      targetType: "s3",
      relationship: "accesses",
      description: "Lambda function can access S3 buckets",
    },
    {
      sourceType: "lambda",
      targetType: "rds",
      relationship: "connects_to",
      description: "Lambda can connect to RDS database",
    },
    {
      sourceType: "rds",
      targetType: "vpc",
      relationship: "depends_on",
      description: "RDS must be deployed within a VPC",
      required: true,
    },
  ],
  gcp: [
    {
      sourceType: "compute",
      targetType: "storage",
      relationship: "accesses",
      description: "Compute Engine can access Cloud Storage",
    },
    {
      sourceType: "compute",
      targetType: "sql",
      relationship: "connects_to",
      description: "Compute Engine connects to Cloud SQL",
    },
    {
      sourceType: "lb",
      targetType: "compute",
      relationship: "load_balances",
      description: "Load balancer distributes traffic to compute instances",
    },
    {
      sourceType: "functions",
      targetType: "storage",
      relationship: "accesses",
      description: "Cloud Functions can access Cloud Storage",
    },
    {
      sourceType: "functions",
      targetType: "sql",
      relationship: "connects_to",
      description: "Cloud Functions can connect to Cloud SQL",
    },
  ],
  azure: [
    {
      sourceType: "vm",
      targetType: "blob",
      relationship: "accesses",
      description: "Virtual Machine can access Blob Storage",
    },
    {
      sourceType: "vm",
      targetType: "sql",
      relationship: "connects_to",
      description: "Virtual Machine connects to SQL Database",
    },
    {
      sourceType: "vm",
      targetType: "vnet",
      relationship: "depends_on",
      description: "Virtual Machine requires Virtual Network",
      required: true,
    },
    {
      sourceType: "lb",
      targetType: "vm",
      relationship: "load_balances",
      description: "Load balancer distributes traffic to VMs",
    },
    {
      sourceType: "functions",
      targetType: "blob",
      relationship: "accesses",
      description: "Azure Functions can access Blob Storage",
    },
  ],
}

export function validateConnection(sourceType: string, targetType: string, provider: string): ConnectionRule | null {
  const rules = connectionRules[provider] || []
  return (
    rules.find(
      (rule) =>
        (rule.sourceType === sourceType && rule.targetType === targetType) ||
        (rule.bidirectional && rule.sourceType === targetType && rule.targetType === sourceType),
    ) || null
  )
}

export function getValidTargets(sourceType: string, provider: string): string[] {
  const rules = connectionRules[provider] || []
  const targets = rules.filter((rule) => rule.sourceType === sourceType).map((rule) => rule.targetType)

  const bidirectionalTargets = rules
    .filter((rule) => rule.bidirectional && rule.targetType === sourceType)
    .map((rule) => rule.sourceType)

  return [...new Set([...targets, ...bidirectionalTargets])]
}

export function getConnectionSuggestions(nodes: any[], provider: string): string[] {
  const suggestions: string[] = []
  const rules = connectionRules[provider] || []

  // Check for required connections that are missing
  nodes.forEach((node) => {
    const requiredRules = rules.filter((rule) => rule.sourceType === node.data.id && rule.required)

    requiredRules.forEach((rule) => {
      const hasTarget = nodes.some((n) => n.data.id === rule.targetType)
      const hasConnection = nodes.some(
        (n) =>
          n.data.id === rule.targetType &&
          // Check if connection exists (this would need to be implemented with edges)
          false, // Placeholder - would check actual edges
      )

      if (hasTarget && !hasConnection) {
        suggestions.push(`${node.data.name} should connect to ${rule.targetType} (${rule.description})`)
      }
    })
  })

  return suggestions
}
