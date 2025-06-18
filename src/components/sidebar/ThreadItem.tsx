import React, { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useConvexMutation } from '@convex-dev/react-query'
import { MoreHorizontal, Pin, Trash2, Edit2, GitBranch, Loader2 } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { cn } from '../../lib/utils'

interface ThreadItemProps {
  thread: {
    _id: Id<'threads'>
    threadId: string
    title: string
    updatedAt: number
    lastMessageAt: number
    generationStatus: 'pending' | 'generating' | 'completed' | 'failed'
    pinned: boolean
    branchParentThreadId?: Id<'threads'>
    branchParentMessageId?: string
    folderId?: Id<'folders'>
  }
  isActive?: boolean
  onTogglePin?: (threadId: string, pinned: boolean) => void
  onDelete?: (threadId: string) => void
  onRename?: (threadId: string, newTitle: string) => void
  onFocus?: () => void
  tabIndex?: number
}

export function ThreadItem({ 
  thread, 
  isActive = false,
  onTogglePin,
  onDelete,
  onRename,
  onFocus,
  tabIndex = 0
}: ThreadItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(thread.title)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const navigate = useNavigate()
  
  // Real Convex mutations
  const updateThread = useConvexMutation(api.threads.mutations.update)
  const deleteThread = useConvexMutation(api.threads.mutations.remove)

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if we're editing, dragging, or clicking on action buttons
    if (isEditing || isDragging) return
    
    // Check if the click target is a button or inside a button
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('[role="button"]')) {
      return
    }

    // Navigate to the thread
    navigate({ to: '/chat/$threadId', params: { threadId: thread.threadId } })
  }

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    try {
      await updateThread({
        threadId: thread.threadId,
        updates: { pinned: !thread.pinned }
      })
      onTogglePin?.(thread.threadId, !thread.pinned)
    } catch (error) {
      console.error('Failed to toggle pin:', error)
    }
  }

  const handleRename = async () => {
    if (editTitle.trim() !== thread.title && editTitle.trim()) {
      try {
        await updateThread({
          threadId: thread.threadId,
          updates: { title: editTitle.trim(), userSetTitle: true }
        })
        onRename?.(thread.threadId, editTitle.trim())
      } catch (error) {
        console.error('Failed to rename thread:', error)
        setEditTitle(thread.title) // Reset on error
      }
    }
    setIsEditing(false)
  }

  const handleDelete = async () => {
    try {
      await deleteThread({ threadId: thread.threadId })
      onDelete?.(thread.threadId)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Failed to delete thread:', error)
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsEditing(true)
    setEditTitle(thread.title)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) {
      if (e.key === 'Enter') {
        handleRename()
      } else if (e.key === 'Escape') {
        setIsEditing(false)
        setEditTitle(thread.title)
      }
    } else {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        navigate({ to: '/chat/$threadId', params: { threadId: thread.threadId } })
      }
    }
  }

  const handleFocus = () => {
    onFocus?.()
  }

  const handleDragStart = (e: React.DragEvent) => {
    // Don't allow dragging when editing
    if (isEditing) {
      e.preventDefault()
      return
    }
    
    e.dataTransfer.setData('text/thread-id', thread.threadId)
    e.dataTransfer.effectAllowed = 'move'
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }


  const contextMenuItems = (
    <>
      <ContextMenuItem onClick={() => handleTogglePin({} as React.MouseEvent)}>
        <Pin className="mr-2 h-4 w-4" />
        {thread.pinned ? 'Unpin' : 'Pin'}
      </ContextMenuItem>
      <ContextMenuItem onClick={() => setIsEditing(true)}>
        <Edit2 className="mr-2 h-4 w-4" />
        Rename
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem 
        onClick={() => setShowDeleteDialog(true)}
        className="text-red-600 focus:text-red-600"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </ContextMenuItem>
    </>
  )

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer",
              isActive 
                ? "bg-accent text-accent-foreground" 
                : "hover:bg-accent/50 focus:bg-accent/50",
              "select-none outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isDragging && "opacity-50"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            tabIndex={tabIndex}
            role="button"
            aria-label={`Thread: ${thread.title}${thread.pinned ? ' (pinned)' : ''}${isActive ? ' (active)' : ''}`}
            draggable={!isEditing}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Branch indicator */}
            {thread.branchParentThreadId && (
              <GitBranch className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            )}

            {/* Generation status indicator */}
            {thread.generationStatus === 'generating' && (
              <Loader2 className="h-3 w-3 animate-spin text-blue-500 flex-shrink-0" />
            )}

            {/* Title */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={handleKeyDown}
                  className="h-6 px-1 text-sm"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="truncate" title={thread.title}>
                  {thread.title}
                </div>
              )}
            </div>

            {/* Action buttons - always rendered to prevent layout shift */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Quick Pin Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTogglePin}
                className={cn(
                  "h-6 w-6 p-0 transition-opacity",
                  !isEditing && thread.pinned 
                    ? "opacity-100 text-yellow-500 hover:text-yellow-600" 
                    : !isEditing && (isHovered || isActive)
                    ? "opacity-70 hover:opacity-100"
                    : "opacity-0 pointer-events-none"
                )}
                title={thread.pinned ? "Unpin thread" : "Pin thread"}
                tabIndex={-1}
              >
                <Pin className="h-3 w-3" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 w-6 p-0 transition-opacity",
                      !isEditing && (isHovered || isActive)
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none"
                    )}
                    onClick={(e) => e.stopPropagation()}
                    tabIndex={-1}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleTogglePin({} as React.MouseEvent)}>
                    <Pin className="mr-2 h-4 w-4" />
                    {thread.pinned ? 'Unpin' : 'Pin'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {contextMenuItems}
        </ContextMenuContent>
      </ContextMenu>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Thread</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{thread.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 