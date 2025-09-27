"use client"

import { Badge } from "@/components/ui/badge"
import { type Edge, EdgeLabelRenderer, type EdgeProps, getBezierPath } from "@xyflow/react"
import { memo } from "react"

interface ConnectionEdgeData {
  relationship?: string
  description?: string
  bidirectional?: boolean
}

export const ConnectionEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
  }: EdgeProps<Edge<ConnectionEdgeData>>) => {
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    })

    const getRelationshipColor = (relationship?: string) => {
      switch (relationship) {
        case "depends_on":
          return "bg-blue-500/20 text-blue-300 border-blue-500/50"
        case "connects_to":
          return "bg-green-500/20 text-green-300 border-green-500/50"
        case "stores_in":
          return "bg-purple-500/20 text-purple-300 border-purple-500/50"
        case "load_balances":
          return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50"
        case "accesses":
          return "bg-orange-500/20 text-orange-300 border-orange-500/50"
        default:
          return "bg-gray-500/20 text-gray-300 border-gray-500/50"
      }
    }

    return (
      <>
        <path
          id={id}
          className={`react-flow__edge-path ${selected ? "stroke-primary" : "stroke-muted-foreground"}`}
          d={edgePath}
          strokeWidth={selected ? 3 : 2}
          fill="none"
        />
        {data?.data?.relationship && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                pointerEvents: "all",
              }}
              className="nodrag nopan"
            >
              <Badge
                variant="outline"
                className={`text-xs px-2 py-1 ${getRelationshipColor(data.data.relationship)} backdrop-blur-sm`}
              >
                {data.data.relationship.replace(/_/g, " ")}
              </Badge>
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    )
  },
)

ConnectionEdge.displayName = "ConnectionEdge"
