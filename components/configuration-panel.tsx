"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ConfigLoader, ServiceConfig } from "@/lib/config-loader"
import { ConfigurationPanelProps } from "@/types"
import { Info, MoreHorizontal, Save, Undo, X } from "lucide-react"
import { useEffect, useState } from "react"

export function ConfigurationPanel({ 
  isOpen, 
  onClose, 
  nodeData, 
  serviceConfig, 
  onConfigUpdate 
}: ConfigurationPanelProps) {
  const [config, setConfig] = useState<Record<string, any>>(nodeData?.config || {})
  const [searchTerm, setSearchTerm] = useState("")
  const [loadedServiceConfig, setLoadedServiceConfig] = useState<ServiceConfig | null>(null)
  const [loading, setLoading] = useState(false)

  // Load service configuration when component mounts
  useEffect(() => {
    const loadConfig = async () => {
      if (!nodeData?.provider || !nodeData?.id) return
      
      setLoading(true)
      try {
        const config = await ConfigLoader.loadServiceConfig(nodeData.provider, nodeData.id)
        setLoadedServiceConfig(config)
      } catch (error) {
        console.error('Failed to load service config:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isOpen && nodeData) {
      loadConfig()
    }
  }, [isOpen, nodeData?.provider, nodeData?.id])

  if (!isOpen || !nodeData) {
    return null
  }

  const currentServiceConfig = serviceConfig || loadedServiceConfig

  const configSchema = currentServiceConfig?.configSchema || {}
  const filteredSchema = Object.entries(configSchema).filter(([key, fieldConfig]: [string, any]) => {
    if (!searchTerm) return true
    return fieldConfig.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
           key.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const updateConfig = (key: string, value: string) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    onConfigUpdate(newConfig)
  }

  const renderConfigField = (key: string, fieldConfig: any) => {
    const value = config[key] || fieldConfig.default || ""
    const isRequired = fieldConfig.required || false

    const renderField = () => {
      switch (fieldConfig.type) {
        case "select":
          return (
            <Select value={value} onValueChange={(val) => updateConfig(key, val)}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder={`Select ${fieldConfig.label}`} />
              </SelectTrigger>
              <SelectContent>
                {fieldConfig.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )

        case "multiselect":
          return (
            <div className="space-y-2">
              <Select value={value} onValueChange={(val) => updateConfig(key, val)}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder={`Select ${fieldConfig.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {fieldConfig.options?.map((option: string) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )

        case "boolean":
          return (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={key}
                checked={value === true || value === "true"}
                onCheckedChange={(checked: boolean) => updateConfig(key, checked.toString())}
              />
              <Label htmlFor={key} className="text-sm text-gray-900">
                {fieldConfig.label}
              </Label>
            </div>
          )

        case "number":
          return (
            <Input
              type="number"
              className="h-8"
              value={value}
              onChange={(e) => updateConfig(key, e.target.value)}
              placeholder={fieldConfig.default?.toString()}
              min={fieldConfig.validation?.min}
              max={fieldConfig.validation?.max}
            />
          )

        case "string":
        default:
          if (fieldConfig.label.toLowerCase().includes("description") || 
              fieldConfig.label.toLowerCase().includes("definition")) {
            return (
              <Textarea
                className="min-h-[80px]"
                value={value}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateConfig(key, e.target.value)}
                placeholder={fieldConfig.default}
              />
            )
          }
          return (
            <Input
              className="h-8"
              value={value}
              onChange={(e) => updateConfig(key, e.target.value)}
              placeholder={fieldConfig.default}
            />
          )
      }
    }

    return (
      <div key={key} className="space-y-2">
        <div className="flex items-center space-x-1">
          <Label className="text-sm font-medium text-gray-900">
            {fieldConfig.label}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {fieldConfig.description && (
            <div title={fieldConfig.description}>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
          )}
        </div>
        {fieldConfig.description && (
          <p className="text-xs text-gray-500">{fieldConfig.description}</p>
        )}
        {renderField()}
      </div>
    )
  }

  const getNodeIconPath = (serviceId: string, provider: string) => {
    const iconMap: Record<string, string> = {
      'lambda': '/aws/Arch_AWS-Lambda_64.svg',
      'ec2': '/aws/Arch_Amazon-EC2_64.svg',
      's3': '/aws/Arch_Amazon-S3-on-Outposts_64.svg',
      'rds': '/aws/Arch_Amazon-RDS_64.svg',
      'alb': '/aws/Arch_Amazon-API-Gateway_64.svg',
      'dynamodb': '/aws/Arch_Amazon-DynamoDB_64.svg',
      'cloudwatch': '/aws/Arch_Amazon-CloudWatch_64.svg',
      'cognito': '/aws/Arch_Amazon-Cognito_64.svg',
      'documentdb': '/aws/Arch_Amazon-DocumentDB_64.svg',
      'elasticache': '/aws/Arch_Amazon-ElastiCache_64.svg',
      'eventbridge': '/aws/Arch_Amazon-EventBridge_64.svg',
      'memorydb': '/aws/Arch_Amazon-MemoryDB_64.svg',
      'app-runner': '/aws/Arch_AWS-App-Runner_64.svg',
      'batch': '/aws/Arch_AWS-Batch_64.svg',
      'fargate': '/aws/Arch_AWS-Fargate_64.svg',
      'iam': '/aws/Arch_AWS-IAM-Identity-Center_64.svg',
      'secrets-manager': '/aws/Arch_AWS-Secrets-Manager_64.svg',
      'step-functions': '/aws/Arch_AWS-Step-Functions_64.svg',
      'x-ray': '/aws/Arch_AWS-X-Ray_64.svg'
    }

    return iconMap[serviceId] || '/aws/Arch_Amazon-EC2_64.svg' // fallback to EC2 icon
  }

  const getNodeColor = (serviceId: string, provider: string) => {
    switch (provider) {
      case 'aws':
        return 'bg-orange-500'
      case 'gcp':
        return 'bg-blue-500'
      case 'azure':
        return 'bg-cyan-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-green-600 font-medium">AUTO SAVED</div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-100 text-gray-600 hover:text-gray-900">
              <Undo className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-100 text-gray-600 hover:text-gray-900">
              <Save className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-100 text-gray-600 hover:text-gray-900">
              <Info className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-100 text-gray-600 hover:text-gray-900" onClick={onClose}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Node Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm bg-white border border-gray-200">
            <img 
              src={getNodeIconPath(nodeData.id, nodeData.provider)} 
              alt={`${nodeData.id} icon`}
              className="w-6 h-6"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 truncate">{nodeData.name}</h3>
            <p className="text-xs text-gray-500">{nodeData.terraformType}</p>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-100 text-gray-600 hover:text-gray-900">
            <MoreHorizontal className="w-3 h-3" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Input
            placeholder="Search attributes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Configuration Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Required Parameters Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-gray-900">Required parameters</h4>
              <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              </div>
            </div>
            
            {/* Resource Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">Resource name</Label>
              <Input
                value={nodeData.name}
                className="h-8 bg-gray-50"
                readOnly
              />
              <p className="text-xs text-gray-500">This name is used to create Terraform resource.</p>
            </div>

            {/* Region */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">Region</Label>
              <Input
                value="US East (N. Virginia)"
                className="h-8 bg-gray-50"
                readOnly
              />
              <p className="text-xs text-gray-500">us-east-1</p>
            </div>

            {/* Dynamic Configuration Fields */}
            {filteredSchema.map(([key, fieldConfig]) => renderConfigField(key, fieldConfig))}
          </div>
        </div>
      </div>
    </div>
  )
}
