"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cancelDeployment, getAllDeployments } from "@/lib/api-service"
import type { DeploymentStatus } from "@/types/deployment"
import {
  CheckCircle,
  Clock,
  Download,
  Play,
  RefreshCw,
  Trash2,
  XCircle
} from "lucide-react"
import { useEffect, useState } from "react"

interface DeploymentStatusPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function DeploymentStatusPanel({ isOpen, onClose }: DeploymentStatusPanelProps) {
  const [deployments, setDeployments] = useState<DeploymentStatus[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadDeployments()
    }
  }, [isOpen])

  const loadDeployments = () => {
    setRefreshing(true)
    try {
      const allDeployments = getAllDeployments()
      setDeployments(allDeployments)
    } catch (error) {
      console.error('Failed to load deployments:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'initializing':
      case 'planning':
      case 'applying':
        return <Play className="w-4 h-4 text-blue-600" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-600" />
      case 'destroying':
        return <Trash2 className="w-4 h-4 text-orange-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'initializing':
      case 'planning':
      case 'applying':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      case 'destroying':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000)
    
    if (duration < 60) {
      return `${duration}s`
    } else if (duration < 3600) {
      return `${Math.floor(duration / 60)}m ${duration % 60}s`
    } else {
      return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`
    }
  }

  const handleCancelDeployment = (deploymentId: string) => {
    const success = cancelDeployment(deploymentId)
    if (success) {
      loadDeployments()
    }
  }

  const downloadLogs = (deployment: DeploymentStatus) => {
    const logContent = deployment.logs.join('\n')
    const blob = new Blob([logContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `deployment-${deployment.id}-logs.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Deployment History</h2>
            <p className="text-sm text-gray-600">View and manage your infrastructure deployments</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDeployments}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {deployments.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No deployments yet</h3>
                <p className="text-gray-600">Deploy your first infrastructure to see it here</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-6 space-y-4">
                {deployments.map((deployment) => (
                  <Card key={deployment.id} className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(deployment.status)}
                          <div>
                            <CardTitle className="text-sm font-medium text-gray-900">
                              Deployment {deployment.id}
                            </CardTitle>
                            <CardDescription className="text-xs text-gray-600">
                              {formatDate(deployment.createdAt)} • {formatDuration(deployment.createdAt, deployment.updatedAt)}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(deployment.status)}>
                            {deployment.status}
                          </Badge>
                          {(deployment.status === 'pending' || deployment.status === 'initializing' || deployment.status === 'planning' || deployment.status === 'applying') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelDeployment(deployment.id)}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadLogs(deployment)}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Logs
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Progress bar for active deployments */}
                        {(deployment.status === 'initializing' || deployment.status === 'planning' || deployment.status === 'applying' || deployment.status === 'pending') && (
                          <div>
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                              <span>{deployment.message}</span>
                              <span>{deployment.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${deployment.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Error message */}
                        {deployment.error && (
                          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            <div className="font-medium">Error:</div>
                            <div>{deployment.error}</div>
                          </div>
                        )}

                        {/* Outputs */}
                        {deployment.outputs && Object.keys(deployment.outputs).length > 0 && (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900 mb-1">Outputs:</div>
                            <div className="bg-gray-50 p-2 rounded text-xs">
                              {Object.entries(deployment.outputs).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="font-medium text-gray-700">{key}:</span>
                                  <span className="text-gray-600">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recent logs */}
                        {deployment.logs.length > 0 && (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900 mb-1">Recent Logs:</div>
                            <div className="bg-gray-50 p-2 rounded text-xs max-h-20 overflow-y-auto">
                              {deployment.logs.slice(-5).map((log, index) => (
                                <div key={index} className="text-gray-600">{log}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  )
}
