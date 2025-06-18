import React, { useState, useRef, useEffect } from 'react'
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

  const handleTogglePin = async () => {
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

  const handleDoubleClick = () => {
    setIsEditing(true)
    setEditTitle(thread.title)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditTitle(thread.title)
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/thread-id', thread.threadId)
    e.dataTransfer.effectAllowed = 'move'
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString()
  }

  const contextMenuItems = (
    <>
      <ContextMenuItem onClick={handleTogglePin}>
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
                : "hover:bg-accent/50",
              "select-none",
              isDragging && "opacity-50"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onDoubleClick={handleDoubleClick}
            draggable={!isEditing}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
                          <div
                className="flex-1 flex items-center gap-2 min-w-0"
                onClick={() => {
                  // Don't navigate if we're currently dragging
                  if (!isDragging) {
                    // Navigate to chat thread
                    navigate({ to: '/chat/$threadId', params: { threadId: thread.threadId } })
                  }
                }}
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
                    onClick={(e) => e.preventDefault()} // Prevent Link navigation
                  />
                ) : (
                  <div className="truncate" title={thread.title}>
                    {thread.title}
                  </div>
                                 )}
               </div>
             </div>

            {/* Hover actions */}
            {(isHovered || isActive) && !isEditing && (
              <div className="flex items-center gap-1">
                {/* Quick Pin Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleTogglePin()
                  }}
                  className={cn(
                    "h-6 w-6 p-0 transition-opacity",
                    thread.pinned 
                      ? "opacity-100 text-yellow-500 hover:text-yellow-600" 
                      : "opacity-0 group-hover:opacity-70 hover:opacity-100"
                  )}
                  title={thread.pinned ? "Unpin thread" : "Pin thread"}
                >
                  <Pin className="h-3 w-3" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.preventDefault()} // Prevent Link navigation
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleTogglePin}>
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
            )}

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