import { useCallback, useEffect, useRef, useState } from 'react'
import type { Node, Edge } from '@xyflow/react'

export interface CanvasState {
  nodes: Node[]
  edges: Edge[]
  timestamp: number
  action: string
}

export function useCanvasHistory() {
  const [history, setHistory] = useState<CanvasState[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const maxHistorySize = useRef(50)
  const lastSaveTime = useRef(0)
  const saveTimeout = useRef<NodeJS.Timeout | null>(null)
  
  // Initialize with an empty state
  useEffect(() => {
    if (history.length === 0) {
      const initialState: CanvasState = {
        nodes: [],
        edges: [],
        timestamp: Date.now(),
        action: 'initial'
      }
      setHistory([initialState])
    }
  }, [history.length])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current)
      }
    }
  }, [])

  const canUndo = currentIndex > 0
  const canRedo = currentIndex < history.length - 1

  const saveState = useCallback((nodes: Node[], edges: Edge[], action: string = 'unknown') => {
    const now = Date.now()
    
    // Prevent saves that are too close together (debounce)
    if (now - lastSaveTime.current < 100) {
      console.log(`Debouncing save for action: ${action}`)
      return
    }
    
    // Clear any pending save
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current)
    }
    
    // Debounce the actual save
    saveTimeout.current = setTimeout(() => {
      const newState: CanvasState = {
        nodes: JSON.parse(JSON.stringify(nodes)), // Deep clone
        edges: JSON.parse(JSON.stringify(edges)), // Deep clone
        timestamp: Date.now(),
        action: action
      }

      console.log(`📝 SAVING STATE for action: ${action}`, { 
        nodes: nodes.length, 
        edges: edges.length,
        currentIndex,
        historyLength: history.length,
        timestamp: new Date().toLocaleTimeString(),
        chronologicalOrder: history.length + 1
      })
      console.log('📚 Full history before save:', history.map((state, idx) => ({
        index: idx,
        action: state.action,
        nodes: state.nodes.length,
        edges: state.edges.length,
        isCurrent: idx === currentIndex
      })))

      setHistory(prev => {
        // Remove any states after current index (when branching)
        const newHistory = prev.slice(0, currentIndex + 1)
        
        // Add new state
        const updatedHistory = [...newHistory, newState]
        
        console.log(`✅ STATE SAVED! New history length: ${updatedHistory.length}`)
        console.log('📚 Full history after save:', updatedHistory.map((state, idx) => ({
          index: idx,
          action: state.action,
          nodes: state.nodes.length,
          edges: state.edges.length,
          isCurrent: idx === currentIndex + 1
        })))
        
        // Limit history size
        if (updatedHistory.length > maxHistorySize.current) {
          return updatedHistory.slice(-maxHistorySize.current)
        }
        
        return updatedHistory
      })

      setCurrentIndex(prev => {
        const newIndex = prev + 1
        console.log(`🎯 INDEX UPDATED: ${prev} → ${newIndex}`)
        return newIndex
      })
      lastSaveTime.current = now
    }, 50) // 50ms debounce
  }, [currentIndex, history.length])

  const undo = useCallback(() => {
    if (canUndo) {
      const newIndex = currentIndex - 1
      console.log(`⏪ UNDO: ${currentIndex} → ${newIndex} (history length: ${history.length})`)
      console.log('📚 History before undo:', history.map((state, idx) => ({
        index: idx,
        action: state.action,
        nodes: state.nodes.length,
        edges: state.edges.length,
        isCurrent: idx === currentIndex,
        willBeCurrent: idx === newIndex
      })))
      setCurrentIndex(newIndex)
    } else {
      console.log('❌ CANNOT UNDO:', { canUndo, currentIndex, historyLength: history.length })
      console.log('📚 Current history:', history.map((state, idx) => ({
        index: idx,
        action: state.action,
        nodes: state.nodes.length,
        edges: state.edges.length,
        isCurrent: idx === currentIndex
      })))
    }
  }, [canUndo, currentIndex, history.length])

  const redo = useCallback(() => {
    if (canRedo) {
      const newIndex = currentIndex + 1
      console.log(`⏩ REDO: ${currentIndex} → ${newIndex} (history length: ${history.length})`)
      console.log('📚 History before redo:', history.map((state, idx) => ({
        index: idx,
        action: state.action,
        nodes: state.nodes.length,
        edges: state.edges.length,
        isCurrent: idx === currentIndex,
        willBeCurrent: idx === newIndex
      })))
      setCurrentIndex(newIndex)
    } else {
      console.log('❌ CANNOT REDO:', { canRedo, currentIndex, historyLength: history.length })
      console.log('📚 Current history:', history.map((state, idx) => ({
        index: idx,
        action: state.action,
        nodes: state.nodes.length,
        edges: state.edges.length,
        isCurrent: idx === currentIndex
      })))
    }
  }, [canRedo, currentIndex, history.length])

  const clearHistory = useCallback(() => {
    const initialState: CanvasState = {
      nodes: [],
      edges: [],
      timestamp: Date.now(),
      action: 'initial'
    }
    setHistory([initialState])
    setCurrentIndex(0)
  }, [])

  const getCurrentState = useCallback((): CanvasState | null => {
    if (currentIndex >= 0 && currentIndex < history.length) {
      return history[currentIndex]
    }
    return null
  }, [currentIndex, history])

  // Debug function to log current history state
  const debugHistory = useCallback(() => {
    console.log('🔍 CURRENT HISTORY STATE:')
    console.log(`  Current Index: ${currentIndex}`)
    console.log(`  History Length: ${history.length}`)
    console.log(`  Can Undo: ${canUndo}`)
    console.log(`  Can Redo: ${canRedo}`)
    console.log('📚 Full History:')
    history.forEach((state, idx) => {
      console.log(`  [${idx}] ${state.action} - ${state.nodes.length} nodes, ${state.edges.length} edges ${idx === currentIndex ? '← CURRENT' : ''}`)
    })
  }, [currentIndex, history.length, canUndo, canRedo, history])

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    saveState,
    clearHistory,
    getCurrentState,
    debugHistory,
    historyLength: history.length,
    currentIndex
  }
}