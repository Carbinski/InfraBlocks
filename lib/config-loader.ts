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
      const config = await import(`../config/${provider}/${serviceId}.json`)
      this.configs.set(key, config.default)
      return config.default
    } catch (error) {
      console.warn(`Failed to load config for ${provider}/${serviceId}:`, error)
      return null
    }
  }

  static async loadAllConfigs(): Promise<Record<string, Record<string, ServiceConfig>>> {
    const result: Record<string, Record<string, ServiceConfig>> = {}
    
    try {
      for (const provider of AVAILABLE_PROVIDERS) {
        result[provider] = {}
        const services = PROVIDER_SERVICES[provider] || []
        
        for (const serviceId of services) {
          const config = await this.loadServiceConfig(provider, serviceId)
          if (config) {
            result[provider][serviceId] = config
          }
        }
      }
    } catch (error) {
      console.error('Failed to load all configs:', error)
    }

    return result
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
