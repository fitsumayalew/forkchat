import React, { createContext, useContext, useState, useEffect } from 'react'

type ModelSelectorPosition = 'header' | 'input'

interface ModelSelectorContextType {
  position: ModelSelectorPosition
  setPosition: (position: ModelSelectorPosition) => void
  isDragging: boolean
  setIsDragging: (dragging: boolean) => void
}

const ModelSelectorContext = createContext<ModelSelectorContextType | undefined>(undefined)

const MODEL_SELECTOR_POSITION_KEY = 'model-selector-position'

export function ModelSelectorProvider({ children }: { children: React.ReactNode }) {
  const [position, setPositionState] = useState<ModelSelectorPosition>('header')
  const [isDragging, setIsDragging] = useState(false)

  // Load position from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(MODEL_SELECTOR_POSITION_KEY)
    if (saved === 'header' || saved === 'input') {
      setPositionState(saved)
    }
  }, [])

  // Global drag end listener to ensure drag state is always reset
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setIsDragging(false)
    }

    const handleGlobalDrop = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('dragend', handleGlobalDragEnd)
      document.addEventListener('drop', handleGlobalDrop)
      
      return () => {
        document.removeEventListener('dragend', handleGlobalDragEnd)
        document.removeEventListener('drop', handleGlobalDrop)
      }
    }
  }, [isDragging])

  // Save position to localStorage when it changes
  const setPosition = (newPosition: ModelSelectorPosition) => {
    setPositionState(newPosition)
    localStorage.setItem(MODEL_SELECTOR_POSITION_KEY, newPosition)
  }

  return (
    <ModelSelectorContext.Provider
      value={{
        position,
        setPosition,
        isDragging,
        setIsDragging,
      }}
    >
      {children}
    </ModelSelectorContext.Provider>
  )
}

export function useModelSelectorPosition() {
  const context = useContext(ModelSelectorContext)
  if (context === undefined) {
    throw new Error('useModelSelectorPosition must be used within a ModelSelectorProvider')
  }
  return context
} 