"use client"

import { Button } from "@/components/ui/button"
import { Undo, Redo } from "lucide-react"

interface UndoRedoControlsProps {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  showCounts?: boolean
  historyLength?: number
  currentIndex?: number
}

export function UndoRedoControls({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  showCounts = false,
  historyLength = 0,
  currentIndex = -1
}: UndoRedoControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onUndo}
        disabled={!canUndo}
        className="flex items-center gap-1"
        title="Undo (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
        Undo
        {showCounts && canUndo && (
          <span className="ml-1 text-xs text-muted-foreground">
            ({currentIndex})
          </span>
        )}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onRedo}
        disabled={!canRedo}
        className="flex items-center gap-1"
        title="Redo (Ctrl+Y)"
      >
        <Redo className="h-4 w-4" />
        Redo
        {showCounts && canRedo && (
          <span className="ml-1 text-xs text-muted-foreground">
            ({historyLength - currentIndex - 1})
          </span>
        )}
      </Button>
    </div>
  )
}

