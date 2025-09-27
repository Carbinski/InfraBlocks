"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Download, CheckCircle } from "lucide-react"
import { TerraformGenerator } from "./terraform-generator"
import type { Node, Edge } from "@xyflow/react"

interface TerraformExportDialogProps {
  provider: string
  nodes: Node[]
  edges: Edge[]
  children: React.ReactNode
}

export function TerraformExportDialog({ provider, nodes, edges, children }: TerraformExportDialogProps) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("terraform")

  const generator = new TerraformGenerator(provider, nodes, edges)
  const terraformCode = generator.generateTerraformCode()
  const terraformOutput = generator.generate()

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getResourceCount = () => {
    const counts: Record<string, number> = {}
    nodes.forEach((node) => {
      const category = node.data.category
      counts[category] = (counts[category] || 0) + 1
    })
    return counts
  }

  const resourceCounts = getResourceCount()

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Export Terraform Configuration
            <Badge variant="outline" className="capitalize">
              {provider}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="terraform">Terraform Code</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="instructions">Deploy Instructions</TabsTrigger>
            </TabsList>

            <TabsContent value="terraform" className="flex-1 overflow-hidden">
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Generated {terraformOutput.resources.length} resources with {edges.length} connections
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(terraformCode)}
                      className="flex items-center gap-2"
                    >
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(terraformCode, `main.tf`)}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={terraformCode}
                  readOnly
                  className="font-mono text-sm flex-1 min-h-0 resize-none"
                  placeholder="Generated Terraform code will appear here..."
                />
              </div>
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold">Resource Summary</h3>
                  <div className="space-y-2">
                    {Object.entries(resourceCounts).map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="text-sm">{category}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Configuration</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Provider</span>
                      <span className="capitalize">{provider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Resources</span>
                      <span>{terraformOutput.resources.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Connections</span>
                      <span>{edges.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Variables</span>
                      <span>{Object.keys(terraformOutput.variables).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Outputs</span>
                      <span>{Object.keys(terraformOutput.outputs).length}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Generated Resources</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {terraformOutput.resources.map((resource, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div>
                        <div className="font-medium text-sm">{resource.name}</div>
                        <div className="text-xs text-muted-foreground">{resource.type}</div>
                      </div>
                      {resource.dependencies && resource.dependencies.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {resource.dependencies.length} deps
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="instructions" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Deployment Instructions</h3>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-muted/50 rounded">
                      <h4 className="font-medium mb-1">1. Save the Configuration</h4>
                      <p className="text-muted-foreground">
                        Download the Terraform code and save it as{" "}
                        <code className="bg-background px-1 rounded">main.tf</code> in a new directory.
                      </p>
                    </div>

                    <div className="p-3 bg-muted/50 rounded">
                      <h4 className="font-medium mb-1">2. Initialize Terraform</h4>
                      <code className="block bg-background p-2 rounded mt-1">terraform init</code>
                    </div>

                    <div className="p-3 bg-muted/50 rounded">
                      <h4 className="font-medium mb-1">3. Plan the Deployment</h4>
                      <code className="block bg-background p-2 rounded mt-1">terraform plan</code>
                    </div>

                    <div className="p-3 bg-muted/50 rounded">
                      <h4 className="font-medium mb-1">4. Apply the Configuration</h4>
                      <code className="block bg-background p-2 rounded mt-1">terraform apply</code>
                    </div>

                    {provider === "aws" && (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                        <h4 className="font-medium mb-1">AWS Prerequisites</h4>
                        <ul className="text-muted-foreground space-y-1">
                          <li>• Configure AWS CLI with appropriate credentials</li>
                          <li>• Ensure you have necessary IAM permissions</li>
                          <li>• Set the database password variable when prompted</li>
                        </ul>
                      </div>
                    )}

                    {provider === "gcp" && (
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                        <h4 className="font-medium mb-1">GCP Prerequisites</h4>
                        <ul className="text-muted-foreground space-y-1">
                          <li>
                            • Authenticate with Google Cloud: <code>gcloud auth login</code>
                          </li>
                          <li>• Set your project ID in the variables</li>
                          <li>• Enable required APIs in your GCP project</li>
                        </ul>
                      </div>
                    )}

                    {provider === "azure" && (
                      <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded">
                        <h4 className="font-medium mb-1">Azure Prerequisites</h4>
                        <ul className="text-muted-foreground space-y-1">
                          <li>
                            • Login to Azure: <code>az login</code>
                          </li>
                          <li>
                            • Set your subscription: <code>az account set --subscription "your-subscription-id"</code>
                          </li>
                          <li>• Ensure you have Contributor role or higher</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
