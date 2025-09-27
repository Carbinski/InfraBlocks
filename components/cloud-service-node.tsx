"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react"
import { Settings, X } from "lucide-react"
import { memo, useState } from "react"

interface CloudServiceNodeData extends Record<string, unknown> {
  id: string
  name: string
  icon: string
  category: string
  description: string
  provider: string
  config?: Record<string, any>
  terraformType?: string
}

export const CloudServiceNode = memo(({ data, selected }: NodeProps<Node<CloudServiceNodeData>>) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [config, setConfig] = useState((data as CloudServiceNodeData)?.config || {})

  // Early return if data is not properly structured
  if (!data) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 min-w-[180px]">
        <div className="text-center text-gray-500 text-sm">
          Invalid node data
        </div>
      </div>
    )
  }

  // Type assertion for the node data
  const nodeData = data as CloudServiceNodeData

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case "aws":
        return "border-orange-500/50 bg-orange-500/10"
      case "gcp":
        return "border-blue-500/50 bg-blue-500/10"
      case "azure":
        return "border-cyan-500/50 bg-cyan-500/10"
      default:
        return "border-border bg-card"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Compute":
        return "bg-green-500/20 text-green-300 border-green-500/30"
      case "Storage":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30"
      case "Database":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30"
      case "Network":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30"
    }
  }

  const getServiceConfig = (serviceId: string, provider: string) => {
    const configs: Record<string, Record<string, any>> = {
      aws: {
        ec2: {
          instance_type: ["t3.micro", "t3.small", "t3.medium", "t3.large"],
          ami: "ami-0abcdef1234567890",
          key_name: "",
          security_groups: [],
        },
        s3: {
          bucket_name: "",
          versioning: ["Enabled", "Disabled"],
          public_access: ["Blocked", "Allowed"],
        },
        rds: {
          engine: ["mysql", "postgres", "mariadb"],
          instance_class: ["db.t3.micro", "db.t3.small", "db.t3.medium"],
          allocated_storage: "20",
        },
        lambda: {
          runtime: ["nodejs18.x", "python3.9", "java11"],
          memory_size: "128",
          timeout: "30",
        },
        vpc: {
          cidr_block: "10.0.0.0/16",
          enable_dns_hostnames: ["true", "false"],
        },
        alb: {
          load_balancer_type: ["application", "network"],
          scheme: ["internet-facing", "internal"],
        },
      },
      gcp: {
        compute: {
          machine_type: ["e2-micro", "e2-small", "e2-medium"],
          zone: "us-central1-a",
          image: "debian-cloud/debian-11",
        },
        storage: {
          bucket_name: "",
          location: ["US", "EU", "ASIA"],
          storage_class: ["STANDARD", "NEARLINE", "COLDLINE"],
        },
        sql: {
          database_version: ["MYSQL_8_0", "POSTGRES_13"],
          tier: ["db-f1-micro", "db-g1-small"],
        },
      },
      azure: {
        vm: {
          vm_size: ["Standard_B1s", "Standard_B2s", "Standard_D2s_v3"],
          location: "East US",
          os_disk_type: ["Standard_LRS", "Premium_LRS"],
        },
        blob: {
          account_tier: ["Standard", "Premium"],
          replication_type: ["LRS", "GRS", "ZRS"],
        },
        sql: {
          sku_name: ["Basic", "S0", "S1"],
          max_size_gb: "2",
        },
      },
    }

    return configs[provider]?.[serviceId] || {}
  }

  const serviceConfig = getServiceConfig(nodeData.id, nodeData.provider)

  const updateConfig = (key: string, value: string) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    // Update the node data
    nodeData.config = newConfig
  }

  const renderConfigField = (key: string, value: any) => {
    if (Array.isArray(value)) {
      return (
        <div key={key} className="space-y-2">
          <Label className="text-xs">{key.replace(/_/g, " ").toUpperCase()}</Label>
          <Select value={config[key] || value[0]} onValueChange={(val) => updateConfig(key, val)}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {value.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    return (
      <div key={key} className="space-y-2">
        <Label className="text-xs">{key.replace(/_/g, " ").toUpperCase()}</Label>
        <Input
          className="h-8"
          value={config[key] || value}
          onChange={(e) => updateConfig(key, e.target.value)}
          placeholder={value}
        />
      </div>
    )
  }

  const getNodeIcon = (serviceId: string, provider: string) => {
    // Return appropriate icons based on service type
    switch (serviceId) {
      case 'lambda':
        return 'λ'
      case 'ec2':
        return '🖥️'
      case 's3':
        return '🪣'
      case 'rds':
        return '🗄️'
      case 'vpc':
        return '🌐'
      case 'alb':
        return '⚖️'
      default:
        return nodeData.icon
    }
  }

  const isImageIcon = (icon: string) => {
    return icon.startsWith('/') && (icon.endsWith('.png') || icon.endsWith('.svg'))
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

  const handleDoubleClick = () => {
    if (Object.keys(serviceConfig).length > 0) {
      setIsConfigOpen(true)
    }
  }

  return (
    <div className={`relative ${selected ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500 border-2 border-white" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500 border-2 border-white" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500 border-2 border-white" />

      <div 
        className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-4 min-w-[120px] max-w-[140px] cursor-pointer hover:shadow-xl hover:border-blue-300 transition-all duration-200 group"
        onDoubleClick={handleDoubleClick}
      >
        {/* Main Icon */}
        <div className="flex flex-col items-center space-y-3">
          <div className={`w-16 h-16 ${getNodeColor(nodeData.id, nodeData.provider)} rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200`}>
            {isImageIcon(nodeData.icon) ? (
              <img src={nodeData.icon} alt={nodeData.name} className="w-10 h-10" />
            ) : (
              <span className="text-white text-2xl font-bold">
                {getNodeIcon(nodeData.id, nodeData.provider)}
              </span>
            )}
          </div>
          
          {/* Service Name */}
          <div className="text-center">
            <h3 className="font-semibold text-sm text-gray-900 mb-1">{nodeData.name}</h3>
            <p className="text-xs text-gray-500 leading-tight">{nodeData.description}</p>
          </div>

          {/* Category Badge */}
          <Badge 
            variant="outline" 
            className={`text-xs ${getCategoryColor(nodeData.category)} border-0`}
          >
            {nodeData.category}
          </Badge>

          {/* Settings indicator */}
          {Object.keys(serviceConfig).length > 0 && (
            <div className="flex items-center justify-center">
              {Object.keys(config).length > 0 ? (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600 font-medium">
                    {Object.keys(config).length} configured
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Settings className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">Click to configure</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Configuration Popover */}
        {Object.keys(serviceConfig).length > 0 && (
          <Popover open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <PopoverContent className="w-80" side="right">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Configure {nodeData.name}</h4>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsConfigOpen(false)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {Object.entries(serviceConfig).map(([key, value]) => renderConfigField(key, value))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  )
})

CloudServiceNode.displayName = "CloudServiceNode"
