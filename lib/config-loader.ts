export interface ConfigField {
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect'
  label: string
  description?: string
  options?: string[]
  default?: any
  required?: boolean
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export interface ServiceConfig {
  id: string
  name: string
  icon: string
  category: string
  description: string
  terraformType: string
  defaultConfig: Record<string, any>
  configSchema: Record<string, ConfigField>
}

// Static configuration for available providers and services
const AVAILABLE_PROVIDERS = ['aws', 'azure', 'gcp'] as const

const PROVIDER_SERVICES: Record<string, string[]> = {
  aws: [
    'api_gateway',
    'cloudwatch', 
    'cognito',
    'dynamodb',
    'ec2',
    'fargate',
    'lambda',
    'rds',
    's3',
    'secrets_manager',
    'sqs',
    'step_functions',
    'vpc'
  ],
  azure: ['vm'],
  gcp: ['compute']
}

export class ConfigLoader {
  private static configs: Map<string, ServiceConfig> = new Map()

  static async loadServiceConfig(provider: string, serviceId: string): Promise<ServiceConfig | null> {
    const key = `${provider}/${serviceId}`
    
    if (this.configs.has(key)) {
      return this.configs.get(key)!
    }

    try {
      // Use fetch to load configs from API route since we can't use fs in client-side code
      const response = await fetch(`/api/config/${provider}/${serviceId}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const config = await response.json()
      this.configs.set(key, config)
      return config
    } catch (error) {
      console.warn(`Failed to load config for ${provider}/${serviceId}:`, error)
      return null
    }
  }

  static async loadAllConfigs(): Promise<Record<string, Record<string, ServiceConfig>>> {
    try {
      // Use fetch to load all configs from API route
      const response = await fetch('/api/config')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.warn('Failed to load all configs:', error)
      return {}
    }
  }

  static getServiceConfig(provider: string, serviceId: string): ServiceConfig | null {
    const key = `${provider}/${serviceId}`
    return this.configs.get(key) || null
  }

  static async getAvailableProviders(): Promise<string[]> {
    return [...AVAILABLE_PROVIDERS]
  }

  static async findServiceById(serviceId: string): Promise<ServiceConfig | null> {
    for (const provider of AVAILABLE_PROVIDERS) {
      const services = PROVIDER_SERVICES[provider] || []
      if (services.includes(serviceId)) {
        const config = await this.loadServiceConfig(provider, serviceId)
        if (config) {
          return config
        }
      }
    }
    
    return null
  }

  static clearCache(): void {
    this.configs.clear()
  }
}
