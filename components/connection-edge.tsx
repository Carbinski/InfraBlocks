"use client"

import { ConnectionEdge as ConnectionEdgeType } from "@/types"
import { type EdgeProps } from "@xyflow/react"
import { memo } from "react"

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
  }: EdgeProps<ConnectionEdgeType>) => {
    // Debug logging
    console.log('ConnectionEdge rendering:', {
      id,
      sourceX,
      sourceY,
      targetX,
      targetY,
      data,
      selected
    })

    // Create a custom straight line with right-angle bends
    const createStepPath = (sx: number, sy: number, tx: number, ty: number) => {
      // Calculate the midpoint for the step
      const midX = (sx + tx) / 2
      const midY = (sy + ty) / 2
      
      // Create a step path: horizontal first, then vertical
      return `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ty} L ${tx} ${ty}`
    }
    
    const edgePath = createStepPath(sourceX, sourceY, targetX, targetY)
    console.log('Edge path created:', edgePath)

    // Get relationship color for the line
    const getLineColor = (relationship?: string) => {
      switch (relationship) {
        case "depends_on":
          return "#3b82f6" // blue-500
        case "connects_to":
          return "#10b981" // emerald-500
        case "stores_in":
          return "#8b5cf6" // violet-500
        case "load_balances":
          return "#f59e0b" // amber-500
        case "accesses":
          return "#f97316" // orange-500
        default:
          return "#6b7280" // gray-500
      }
    }

    const lineColor = getLineColor(data?.relationship)

    return (
      <>
        {/* Invisible wider path for easier selection */}
        <path
          id={`${id}-invisible`}
          d={edgePath}
          strokeWidth={20}
          fill="none"
          stroke="transparent"
          style={{ 
            cursor: "pointer",
            pointerEvents: "all"
          }}
        />
        {/* Visible edge path */}
        <path
          id={id}
          className="react-flow__edge-path"
          d={edgePath}
          strokeWidth={selected ? 4 : 3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ 
            stroke: selected ? "#ef4444" : lineColor, // red when selected, colored based on relationship
            cursor: "pointer",
            pointerEvents: "all"
          }}
          data-custom="true"
        />
      </>
    )
  },
)

ConnectionEdge.displayName = "ConnectionEdge"
