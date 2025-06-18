import React from 'react'
import { ModelSelector } from './ModelSelector'
import { useModelSelectorPosition } from '../../contexts/ModelSelectorContext'
import { GripVertical } from 'lucide-react'

interface DraggableModelSelectorProps {
  location: 'header' | 'input'
}

export function DraggableModelSelector({ location }: DraggableModelSelectorProps) {
  const { position, isDragging, setIsDragging } = useModelSelectorPosition()

  // Only render if this is the correct location for the ModelSelector
  if (position !== location) {
    return null
  }

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    e.dataTransfer.setData('text/plain', position)
    e.dataTransfer.effectAllowed = 'move'
    
    // Create a custom drag image
    const dragImage = document.createElement('div')
    dragImage.textContent = 'Model Selector'
    dragImage.style.cssText = `
      position: absolute;
      top: -1000px;
      left: -1000px;
      padding: 8px 12px;
      background: hsl(var(--primary));
      color: hsl(var(--primary-foreground));
      border-radius: 6px;
      font-size: 14px;
      z-index: 1000;
    `
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 0, 0)
    
    // Clean up drag image after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage)
    }, 100)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  return (
    <div className={`
      group flex items-center gap-2 transition-all duration-200
      ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
      ${location === 'input' ? 'rounded-lg border border-dashed border-border/50 p-2' : ''}
    `}>
      {/* Drag Handle - only this part is draggable */}
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-move p-1 rounded hover:bg-muted/50 dark:hover:bg-muted/50"
        title="Drag to move between header and input area"
        onClick={(e) => e.stopPropagation()} // Prevent bubbling to ModelSelector
      >
        <GripVertical className="size-4 text-muted-foreground" />
      </div>
      
      {/* ModelSelector - not draggable, can be clicked normally */}
      <ModelSelector />
    </div>
  )
} 