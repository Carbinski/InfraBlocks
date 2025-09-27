export interface AWSCredentials {
  accessKeyId: string
  secretAccessKey: string
  region: string
}

export interface GCPCredentials {
  serviceAccountKey: string // Base64 encoded JSON
  projectId: string
}

export interface AzureCredentials {
  clientId: string
  clientSecret: string
  tenantId: string
  subscriptionId: string
}

export interface Credentials {
  aws?: AWSCredentials
  gcp?: GCPCredentials
  azure?: AzureCredentials
}

export class CredentialManager {
  private static readonly STORAGE_KEY = 'infrastructure-designer-credentials'

  /**
   * Save credentials to localStorage (encrypted in production)
   */
  static saveCredentials(provider: keyof Credentials, credentials: any): void {
    try {
      const existingCredentials = this.getStoredCredentials()
      
      // Basic encryption for demo (in production, use proper encryption)
      const encryptedCredentials = this.encrypt(credentials)
      
      existingCredentials[provider] = encryptedCredentials
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingCredentials))
      console.log(`Credentials saved for ${provider}`)
    } catch (error) {
      console.error('Failed to save credentials:', error)
      throw new Error('Failed to save credentials')
    }
  }

  /**
   * Get credentials from localStorage
   */
  static getCredentials(provider: keyof Credentials): any {
    try {
      const storedCredentials = this.getStoredCredentials()
      const encryptedCredentials = storedCredentials[provider]
      
      if (!encryptedCredentials) {
        return null
      }
      
      return this.decrypt(encryptedCredentials)
    } catch (error) {
      console.error('Failed to get credentials:', error)
      return null
    }
  }

  /**
   * Check if credentials exist for a provider
   */
  static hasCredentials(provider: keyof Credentials): boolean {
    const credentials = this.getCredentials(provider)
    return credentials !== null && Object.keys(credentials).length > 0
  }

  /**
   * Delete credentials for a provider
   */
  static deleteCredentials(provider: keyof Credentials): void {
    try {
      const existingCredentials = this.getStoredCredentials()
      delete existingCredentials[provider]
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingCredentials))
      console.log(`Credentials deleted for ${provider}`)
    } catch (error) {
      console.error('Failed to delete credentials:', error)
      throw new Error('Failed to delete credentials')
    }
  }

  /**
   * Get all stored credentials (encrypted)
   */
  private static getStoredCredentials(): Credentials {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error('Failed to parse stored credentials:', error)
      return {}
    }
  }

  /**
   * Simple encryption for demo purposes (replace with proper encryption in production)
   */
  private static encrypt(data: any): any {
    // In production, use proper encryption libraries like crypto-js or Web Crypto API
    const jsonString = JSON.stringify(data)
    const encoded = btoa(jsonString)
    return { encrypted: encoded, timestamp: Date.now() }
  }

  /**
   * Simple decryption for demo purposes (replace with proper decryption in production)
   */
  private static decrypt(encryptedData: any): any {
    try {
      // In production, use proper decryption
      const decoded = atob(encryptedData.encrypted)
      return JSON.parse(decoded)
    } catch (error) {
      console.error('Failed to decrypt credentials:', error)
      return null
    }
  }

  /**
   * Validate AWS credentials format
   */
  static validateAWSCredentials(credentials: Partial<AWSCredentials>): string[] {
    const errors: string[] = []
    
    if (!credentials.accessKeyId) {
      errors.push('Access Key ID is required')
    } else if (!credentials.accessKeyId.startsWith('AKIA')) {
      errors.push('Access Key ID should start with AKIA')
    }
    
    if (!credentials.secretAccessKey) {
      errors.push('Secret Access Key is required')
    } else if (credentials.secretAccessKey.length < 20) {
      errors.push('Secret Access Key should be at least 20 characters')
    }
    
    if (!credentials.region) {
      errors.push('Region is required')
    } else if (!/^[a-z]{2}-[a-z]+-\d+$/.test(credentials.region)) {
      errors.push('Region format should be like us-east-1')
    }
    
    return errors
  }

  /**
   * Validate GCP credentials format
   */
  static validateGCPCredentials(credentials: Partial<GCPCredentials>): string[] {
    const errors: string[] = []
    
    if (!credentials.serviceAccountKey) {
      errors.push('Service Account Key is required')
    }
    
    if (!credentials.projectId) {
      errors.push('Project ID is required')
    }
    
    return errors
  }

  /**
   * Validate Azure credentials format
   */
  static validateAzureCredentials(credentials: Partial<AzureCredentials>): string[] {
    const errors: string[] = []
    
    if (!credentials.clientId) {
      errors.push('Client ID is required')
    } else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(credentials.clientId)) {
      errors.push('Client ID should be a valid UUID')
    }
    
    if (!credentials.clientSecret) {
      errors.push('Client Secret is required')
    }
    
    if (!credentials.tenantId) {
      errors.push('Tenant ID is required')
    } else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(credentials.tenantId)) {
      errors.push('Tenant ID should be a valid UUID')
    }
    
    if (!credentials.subscriptionId) {
      errors.push('Subscription ID is required')
    } else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(credentials.subscriptionId)) {
      errors.push('Subscription ID should be a valid UUID')
    }
    
    return errors
  }
}
