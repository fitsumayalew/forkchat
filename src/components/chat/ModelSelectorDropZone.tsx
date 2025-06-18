import React, { useState } from 'react'
import { useModelSelectorPosition } from '../../contexts/ModelSelectorContext'
import { DraggableModelSelector } from './DraggableModelSelector'

interface ModelSelectorDropZoneProps {
  location: 'header' | 'input'
  children?: React.ReactNode
  className?: string
}

export function ModelSelectorDropZone({ 
  location, 
  children, 
  className = '' 
}: ModelSelectorDropZoneProps) {
  const { position, setPosition, isDragging, setIsDragging } = useModelSelectorPosition()
  const [draggedOver, setDraggedOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDraggedOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set draggedOver to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDraggedOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDraggedOver(false)
    
    const draggedPosition = e.dataTransfer.getData('text/plain') as 'header' | 'input'
    
    // Only change position if dropping in a different location
    if (draggedPosition !== location) {
      setPosition(location)
    }
    
    // Always reset dragging state when drop occurs
    setIsDragging(false)
  }

  const showDropIndicator = isDragging && position !== location
  const isActiveDropZone = showDropIndicator && draggedOver

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        ${className}
        ${showDropIndicator ? 'relative min-h-[60px]' : ''}
        ${isActiveDropZone ? 'bg-primary/10' : ''}
        ${isDragging && position !== location ? 'transition-all duration-200' : ''}
      `}
      style={{
        minWidth: showDropIndicator ? '200px' : undefined,
      }}
    >
      {children}
      <DraggableModelSelector location={location} />
      
      {/* Drop indicator - shows when dragging to a different location */}
      {showDropIndicator && (
        <div className={`
          absolute inset-0 pointer-events-none rounded-lg transition-all duration-200 z-10
          ${isActiveDropZone 
            ? 'border-2 border-dashed border-blue-400 bg-blue-50/80 dark:bg-blue-900/30' 
            : 'border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/60 dark:bg-gray-800/30'
          }
        `}>
          <div className={`
            flex items-center justify-center h-full text-xs font-medium transition-colors duration-200 px-2
            ${isActiveDropZone ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}
          `}>
            {isActiveDropZone ? '📍 Drop Model Selector Here' : '📦 Drop Zone Available'}
          </div>
        </div>
      )}
    </div>
  )
} 