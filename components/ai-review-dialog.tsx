"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Info,
  Loader2,
  Shield,
  TrendingUp,
  Brain,
  AlertCircle,
  Lightbulb,
  BarChart3
} from "lucide-react"

interface AIReviewDialogProps {
  isOpen: boolean
  onClose: () => void
  analysis: AIAnalysis | null
  isLoading: boolean
  error: string | null
}

interface AIAnalysis {
  overallScore: number
  summary: string
  strengths: string[]
  issues: {
    severity: "high" | "medium" | "low"
    category: "security" | "performance" | "cost" | "best-practices" | "syntax"
    description: string
    recommendation: string
    file: string
    line: number
  }[]
  recommendations: {
    category: "security" | "performance" | "cost" | "best-practices"
    title: string
    description: string
    impact: "high" | "medium" | "low"
  }[]
  costOptimization: {
    estimatedMonthlyCost: string
    suggestions: string[]
  }
  securityAnalysis: {
    securityScore: number
    findings: string[]
  }
}

const getImpactSeverityColor = (level: "high" | "medium" | "low" | string) => {
  switch (level) {
    case "high":
      return "bg-destructive"
    case "medium":
      return "bg-chart-4"
    case "low":
      return "bg-chart-2"
    default:
      return "bg-muted-foreground"
  }
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "security":
      return <Shield className="w-4 h-4" />
    case "performance":
      return <TrendingUp className="w-4 h-4" />
    case "cost":
      return <DollarSign className="w-4 h-4" />
    case "best-practices":
      return <CheckCircle className="w-4 h-4" />
    default:
      return <Info className="w-4 h-4" />
  }
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600"
  if (score >= 60) return "text-yellow-600"
  return "text-red-600"
}

const LoadingState = () => (
    <>
        <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              AI Review in Progress
            </DialogTitle>
            <DialogDescription>
              Analyzing your Terraform configuration for security, cost, and best practices...
            </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">AI is reviewing your infrastructure</p>
                  <p className="text-xs text-gray-500">This usually takes 10-20 seconds</p>
                </div>
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    <span>Security</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    <span>Cost</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Performance</span>
                  </div>
                </div>
              </div>
            </div>
        </div>
    </>
)

const ErrorState = ({ error, onClose }: { error: string; onClose: () => void }) => (
    <>
        <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              AI Review Error
            </DialogTitle>
            <DialogDescription>
              There was an error analyzing your infrastructure.
            </DialogDescription>
        </DialogHeader>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
        </div>
        <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
        </div>
    </>
)

const OverviewTab = ({ analysis }: { analysis: AIAnalysis }) => (
    <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-card rounded-lg border">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-foreground">Overall Score</span>
            </div>
            <div className={cn("text-2xl font-bold mb-2", getScoreColor(analysis.overallScore))}>
              {analysis.overallScore}/100
            </div>
            <Progress value={analysis.overallScore} />
          </div>

          <div className="p-4 bg-card rounded-lg border">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-foreground">Security Score</span>
            </div>
            <div className={cn("text-2xl font-bold mb-2", getScoreColor(analysis.securityAnalysis.securityScore))}>
              {analysis.securityAnalysis.securityScore}/100
            </div>
            <Progress value={analysis.securityAnalysis.securityScore} />
          </div>

          <div className="p-4 bg-card rounded-lg border">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-foreground">Est. Monthly Cost</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {analysis.costOptimization.estimatedMonthlyCost}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3 text-lg">Summary</h3>
            <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-lg">Strengths</h3>
            <div className="space-y-2">
              {analysis.strengths.map((strength, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{strength}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
    </TabsContent>
)

const IssuesTab = ({ issues }: { issues: AIAnalysis['issues'] }) => (
    <TabsContent value="issues" className="space-y-4">
        <ScrollArea className="h-96">
          <div className="space-y-4 pr-4">
            {issues.map((issue, index) => (
              <div key={index} className="p-4 bg-card border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(issue.category)}
                    <span className="font-medium text-foreground">{issue.description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", getImpactSeverityColor(issue.severity))}></div>
                    <span className="text-xs text-muted-foreground capitalize">{issue.severity}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{issue.recommendation}</p>
                <div className="text-xs text-muted-foreground">
                  {issue.file}:{issue.line} • {issue.category}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
    </TabsContent>
)

const RecommendationsTab = ({ recommendations }: { recommendations: AIAnalysis['recommendations'] }) => (
    <TabsContent value="recommendations" className="space-y-6">
        <ScrollArea className="h-96">
            <div className="space-y-4 pr-4">
            {recommendations.map((rec, index) => (
                <div key={index} className="p-4 bg-card border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                    {getCategoryIcon(rec.category)}
                    <span className="font-medium text-foreground">{rec.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", getImpactSeverityColor(rec.impact))}></div>
                    <span className="text-xs text-muted-foreground capitalize">{rec.impact} impact</span>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{rec.description}</p>
                </div>
            ))}
            </div>
        </ScrollArea>
    </TabsContent>
)

const CostAndSecurityTab = ({ costOptimization, securityAnalysis }: { costOptimization: AIAnalysis['costOptimization'], securityAnalysis: AIAnalysis['securityAnalysis'] }) => (
    <TabsContent value="cost" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5" />
                Cost Optimization
            </h3>
            <div className="space-y-3">
                {costOptimization.suggestions.map((suggestion, index) => (
                <div key={index} className="p-4 bg-muted border rounded-lg">
                    <p className="text-sm text-muted-foreground leading-relaxed">{suggestion}</p>
                </div>
                ))}
            </div>
            </div>

            <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                <Shield className="w-5 h-5" />
                Security Findings
            </h3>
            <div className="space-y-3">
                {securityAnalysis.findings.map((finding, index) => (
                <div key={index} className="p-4 bg-muted border rounded-lg">
                    <p className="text-sm text-muted-foreground leading-relaxed">{finding}</p>
                </div>
                ))}
            </div>
            </div>
        </div>
    </TabsContent>
)

const AnalysisContent = ({ analysis, onClose }: { analysis: AIAnalysis; onClose: () => void; }) => {
    return (
        <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Infrastructure Review
              </DialogTitle>
              <DialogDescription>
                Comprehensive analysis of your Terraform configuration
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="issues" className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Issues
                </TabsTrigger>
                <TabsTrigger value="recommendations" className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Recommendations
                </TabsTrigger>
                <TabsTrigger value="cost" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Cost & Security
                </TabsTrigger>
              </TabsList>

              <OverviewTab analysis={analysis} />
              <IssuesTab issues={analysis.issues} />
              <RecommendationsTab recommendations={analysis.recommendations} />
              <CostAndSecurityTab costOptimization={analysis.costOptimization} securityAnalysis={analysis.securityAnalysis} />
            </Tabs>
        </>
    )
}


export function AIReviewDialog({ isOpen, onClose, analysis, isLoading, error }: AIReviewDialogProps) {
    
    const renderContent = () => {
        if (isLoading) {
            return <LoadingState />;
        }
        if (error) {
            return <ErrorState error={error} onClose={onClose} />;
        }
        if (analysis) {
            return <AnalysisContent analysis={analysis} onClose={onClose} />;
        }
        return null;
    }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] !max-w-5xl !w-[76vw] sm:!w-[72vw] lg:!w-[64vw]">
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
