import { ConfigField } from '@/components/service-definitions'

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
    const providers = ['aws', 'gcp', 'azure']
    const result: Record<string, Record<string, ServiceConfig>> = {}

    for (const provider of providers) {
      result[provider] = {}
      
      // Define known services for each provider
      const services: Record<string, string[]> = {
        aws: ['ec2', 's3', 'rds', 'lambda', 'dynamodb', 'vpc'],
        gcp: ['compute'],
        azure: ['vm']
      }

      for (const serviceId of services[provider] || []) {
        const config = await this.loadServiceConfig(provider, serviceId)
        if (config) {
          result[provider][serviceId] = config
        }
      }
    }

    return result
  }

  static getServiceConfig(provider: string, serviceId: string): ServiceConfig | null {
    const key = `${provider}/${serviceId}`
    return this.configs.get(key) || null
  }
}
