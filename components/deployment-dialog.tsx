"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play, CheckCircle, XCircle, Clock, AlertTriangle, Terminal, ExternalLink, RefreshCw } from "lucide-react"
import type { Node, Edge } from "@xyflow/react"

interface DeploymentDialogProps {
  provider: string
  nodes: Node[]
  edges: Edge[]
  children: React.ReactNode
}

interface DeploymentStep {
  id: string
  name: string
  status: "pending" | "running" | "completed" | "failed"
  message?: string
  duration?: number
  logs?: string[]
}

interface DeploymentConfig {
  region: string
  environment: string
  projectName: string
  autoApprove: boolean
}

export function DeploymentDialog({ provider, nodes, edges, children }: DeploymentDialogProps) {
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentId, setDeploymentId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("config")
  const [config, setConfig] = useState<DeploymentConfig>({
    region: getDefaultRegion(provider),
    environment: "dev",
    projectName: "my-infrastructure",
    autoApprove: false,
  })

  const [steps, setSteps] = useState<DeploymentStep[]>([
    { id: "validate", name: "Validate Configuration", status: "pending" },
    { id: "plan", name: "Generate Deployment Plan", status: "pending" },
    { id: "approve", name: "Approval Required", status: "pending" },
    { id: "deploy", name: "Deploy Resources", status: "pending" },
    { id: "verify", name: "Verify Deployment", status: "pending" },
  ])

  const [logs, setLogs] = useState<string[]>([])

  function getDefaultRegion(provider: string): string {
    switch (provider) {
      case "aws":
        return "us-east-1"
      case "gcp":
        return "us-central1"
      case "azure":
        return "East US"
      default:
        return "us-east-1"
    }
  }

  const simulateDeployment = async () => {
    if (nodes.length === 0) {
      addLog("❌ No resources to deploy. Please add services to your canvas first.")
      return
    }

    setIsDeploying(true)
    setDeploymentId(`deploy-${Date.now()}`)
    setActiveTab("progress")
    setProgress(0)

    const totalSteps = steps.length
    let currentStep = 0

    for (const step of steps) {
      // Update step to running
      setSteps((prev) =>
        prev.map((s) =>
          s.id === step.id ? { ...s, status: "running", message: `Executing ${step.name.toLowerCase()}...` } : s,
        ),
      )

      addLog(`🔄 Starting: ${step.name}`)

      // Simulate step execution
      await simulateStep(step)

      currentStep++
      setProgress((currentStep / totalSteps) * 100)

      // Random chance of failure for demo purposes
      const shouldFail = Math.random() < 0.1 && step.id !== "validate"

      if (shouldFail) {
        setSteps((prev) =>
          prev.map((s) =>
            s.id === step.id ? { ...s, status: "failed", message: `Failed to ${step.name.toLowerCase()}` } : s,
          ),
        )
        addLog(`❌ Failed: ${step.name}`)
        setIsDeploying(false)
        return
      }

      // Update step to completed
      setSteps((prev) =>
        prev.map((s) =>
          s.id === step.id ? { ...s, status: "completed", message: `${step.name} completed successfully` } : s,
        ),
      )

      addLog(`✅ Completed: ${step.name}`)

      // Special handling for approval step
      if (step.id === "approve" && !config.autoApprove) {
        addLog("⏳ Waiting for manual approval...")
        // In a real implementation, this would wait for user approval
        await new Promise((resolve) => setTimeout(resolve, 2000))
        addLog("✅ Deployment approved")
      }
    }

    addLog("🎉 Deployment completed successfully!")
    addLog(`📊 Deployed ${nodes.length} resources with ${edges.length} connections`)
    addLog(`🔗 View your resources in the ${provider.toUpperCase()} console`)

    setIsDeploying(false)
  }

  const simulateStep = async (step: DeploymentStep): Promise<void> => {
    const duration = Math.random() * 3000 + 1000 // 1-4 seconds

    switch (step.id) {
      case "validate":
        addLog("🔍 Validating Terraform configuration...")
        addLog("🔍 Checking resource dependencies...")
        addLog("🔍 Validating provider credentials...")
        break

      case "plan":
        addLog("📋 Generating Terraform plan...")
        addLog(`📋 Plan: ${nodes.length} to add, 0 to change, 0 to destroy`)
        nodes.forEach((node) => {
          addLog(`  + ${node.data.terraformType}.${node.data.name || node.data.id}`)
        })
        break

      case "approve":
        if (config.autoApprove) {
          addLog("✅ Auto-approval enabled, proceeding...")
        } else {
          addLog("⏳ Manual approval required...")
        }
        break

      case "deploy":
        addLog("🚀 Starting resource deployment...")
        for (const node of nodes) {
          addLog(`🔨 Creating ${node.data.terraformType}.${node.data.name || node.data.id}...`)
          await new Promise((resolve) => setTimeout(resolve, 500))
          addLog(`✅ Created ${node.data.terraformType}.${node.data.name || node.data.id}`)
        }
        break

      case "verify":
        addLog("🔍 Verifying deployed resources...")
        addLog("🔍 Checking resource health...")
        addLog("🔍 Validating connections...")
        break
    }

    await new Promise((resolve) => setTimeout(resolve, duration))
  }

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`])
  }

  const resetDeployment = () => {
    setIsDeploying(false)
    setDeploymentId(null)
    setProgress(0)
    setSteps((prev) => prev.map((s) => ({ ...s, status: "pending", message: undefined })))
    setLogs([])
    setActiveTab("config")
  }

  const getStepIcon = (status: DeploymentStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "running":
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  const canDeploy = nodes.length > 0 && config.region && config.environment && config.projectName

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Deploy Infrastructure
            <Badge variant="outline" className="capitalize">
              {provider}
            </Badge>
            {deploymentId && (
              <Badge variant="secondary" className="font-mono text-xs">
                {deploymentId}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="config" disabled={isDeploying}>
                Configuration
              </TabsTrigger>
              <TabsTrigger value="progress">Deployment Progress</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      value={config.region}
                      onChange={(e) => setConfig((prev) => ({ ...prev, region: e.target.value }))}
                      placeholder={getDefaultRegion(provider)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="environment">Environment</Label>
                    <Input
                      id="environment"
                      value={config.environment}
                      onChange={(e) => setConfig((prev) => ({ ...prev, environment: e.target.value }))}
                      placeholder="dev, staging, prod"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projectName">Project Name</Label>
                    <Input
                      id="projectName"
                      value={config.projectName}
                      onChange={(e) => setConfig((prev) => ({ ...prev, projectName: e.target.value }))}
                      placeholder="my-infrastructure"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="autoApprove"
                      checked={config.autoApprove}
                      onChange={(e) => setConfig((prev) => ({ ...prev, autoApprove: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="autoApprove" className="text-sm">
                      Auto-approve deployment (skip manual approval)
                    </Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Deployment Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Resources to deploy:</span>
                        <Badge variant="secondary">{nodes.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Connections:</span>
                        <Badge variant="secondary">{edges.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Provider:</span>
                        <span className="capitalize">{provider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Region:</span>
                        <span>{config.region}</span>
                      </div>
                    </div>
                  </div>

                  {nodes.length === 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>No resources to deploy. Add services to your canvas first.</AlertDescription>
                    </Alert>
                  )}

                  {!config.autoApprove && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Manual approval is required. The deployment will pause for your confirmation.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Estimated deployment time: {Math.ceil(nodes.length * 0.5)} - {Math.ceil(nodes.length * 1.5)} minutes
                </div>
                <div className="flex gap-2">
                  {deploymentId && (
                    <Button variant="outline" onClick={resetDeployment}>
                      Reset
                    </Button>
                  )}
                  <Button
                    onClick={simulateDeployment}
                    disabled={!canDeploy || isDeploying}
                    className="flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    {isDeploying ? "Deploying..." : "Start Deployment"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="progress" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Deployment Progress</h3>
                  <Badge variant={isDeploying ? "default" : progress === 100 ? "default" : "secondary"}>
                    {isDeploying ? "In Progress" : progress === 100 ? "Completed" : "Ready"}
                  </Badge>
                </div>

                <Progress value={progress} className="w-full" />

                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="flex-shrink-0">{getStepIcon(step.status)}</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{step.name}</div>
                        {step.message && <div className="text-xs text-muted-foreground">{step.message}</div>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Step {index + 1} of {steps.length}
                      </div>
                    </div>
                  ))}
                </div>

                {progress === 100 && !isDeploying && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>Deployment completed successfully!</span>
                      <Button variant="outline" size="sm" className="ml-2 bg-transparent">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View in Console
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="logs" className="flex-1 overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Deployment Logs
                  </h3>
                  <Badge variant="secondary">{logs.length} entries</Badge>
                </div>

                <ScrollArea className="flex-1 border rounded-lg p-4 bg-muted/50">
                  <div className="space-y-1 font-mono text-sm">
                    {logs.length === 0 ? (
                      <div className="text-muted-foreground">No logs yet. Start a deployment to see logs here.</div>
                    ) : (
                      logs.map((log, index) => (
                        <div key={index} className="text-xs leading-relaxed">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
