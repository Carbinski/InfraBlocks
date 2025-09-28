"use client"

import { ConfigLoader, ServiceConfig } from "@/lib/config-loader"
import { CloudServiceNodeData, CloudServiceNode as CloudServiceNodeType } from "@/types"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { memo, useEffect, useState } from "react"

interface CloudServiceNodeProps extends NodeProps<CloudServiceNodeType> {
  onDoubleClick?: (nodeData: CloudServiceNodeData) => void
}

export const CloudServiceNode = memo(({ data, selected, onDoubleClick }: CloudServiceNodeProps) => {
  const [config, setConfig] = useState((data as CloudServiceNodeData)?.config || {})
  const [serviceConfig, setServiceConfig] = useState<ServiceConfig | null>(null)
  const [loading, setLoading] = useState(false)

  // Early return if data is not properly structured
  if (!data) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 min-w-[100px]">
        <div className="text-center text-gray-500 text-xs">
          Invalid
        </div>
      </div>
    )
  }

  
  const nodeData = data as CloudServiceNodeData

  // Load service configuration when component mounts
  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true)
      try {
        const config = await ConfigLoader.loadServiceConfig(nodeData.provider, nodeData.id)
        setServiceConfig(config)
      } catch (error) {
        console.error('Failed to load service config:', error)
      } finally {
        setLoading(false)
      }
    }

    if (nodeData.provider && nodeData.id) {
      loadConfig()
    }
  }, [nodeData.provider, nodeData.id])



  const getNodeIcon = (serviceId: string, provider: string) => {
    // Always use the icon from the service config first
    if (nodeData.icon) {
      return nodeData.icon
    }
    
    // Fallback to hardcoded icons only if no config icon is available
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
        return '☁️' // Generic cloud icon
    }
  }

  const isImageIcon = (icon: string) => {
    return icon.startsWith('/') && (icon.endsWith('.png') || icon.endsWith('.svg') || icon.endsWith('.jpg') || icon.endsWith('.jpeg'))
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
    if (onDoubleClick && nodeData) {
      onDoubleClick(nodeData)
    }
  }

  return (
    <div className={`relative ${selected ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}>
      {/* Handles on all four sides: top, bottom, left, right */}
      {/* Left side handles */}
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="w-3.5 h-3.5 !bg-blue-400 dark:!bg-blue-500 hover:!bg-blue-600 dark:hover:bg-blue-700 transition-colors"
        style={{ opacity: 1 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="w-3.5 h-3.5 !bg-blue-400 dark:!bg-blue-500 hover:!bg-blue-600 dark:hover:bg-blue-700 transition-colors"
        style={{ opacity: 1 }}
      />
      
      {/* Right side handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="w-3.5 h-3.5 !bg-blue-400 dark:!bg-blue-500 hover:!bg-blue-600 dark:hover:bg-blue-700 transition-colors"
        style={{ opacity: 1 }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="w-3.5 h-3.5 !bg-blue-400 dark:!bg-blue-500 hover:!bg-blue-600 dark:hover:bg-blue-700 transition-colors"
        style={{ opacity: 1 }}
      />
      
      {/* Top side handles */}
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="w-3.5 h-3.5 !bg-blue-400 dark:!bg-blue-500 hover:!bg-blue-600 dark:hover:bg-blue-700 transition-colors"
        style={{ opacity: 1 }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="w-3.5 h-3.5 !bg-blue-400 dark:!bg-blue-500 hover:!bg-blue-600 dark:hover:bg-blue-700 transition-colors"
        style={{ opacity: 1 }}
      />
      
      {/* Bottom side handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="w-3.5 h-3.5 !bg-blue-400 dark:!bg-blue-500 hover:!bg-blue-600 dark:hover:bg-blue-700 transition-colors"
        style={{ opacity: 1 }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="w-3.5 h-3.5 !bg-blue-400 dark:!bg-blue-500 hover:!bg-blue-600 dark:hover:bg-blue-700 transition-colors"
        style={{ opacity: 1 }}
      />

      <div 
        className="cursor-pointer hover:scale-105 transition-transform duration-200"
        onDoubleClick={handleDoubleClick}
      >
        {/* Just the image */}
        {isImageIcon(nodeData.icon) ? (
          <img src={nodeData.icon} alt={nodeData.name} className="w-18 h-18" />
        ) : (
          <div className={`w-10 h-10 ${getNodeColor(nodeData.id, nodeData.provider)} flex items-center justify-center shadow-md`}>
            <span className="text-gray-900 text-base font-bold">
              {getNodeIcon(nodeData.id, nodeData.provider)}
            </span>
          </div>
        )}

      </div>
    </div>
  )
})

CloudServiceNode.displayName = "CloudServiceNode"
