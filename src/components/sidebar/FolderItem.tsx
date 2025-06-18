import React, { useState } from 'react'
import { useConvexMutation } from '@convex-dev/react-query'
import { ChevronRight, ChevronDown, Folder, FolderOpen, MoreHorizontal, Edit2, Trash2, GripVertical } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
import { ThreadItem } from './ThreadItem'
import { cn } from '../../lib/utils'

interface FolderItemProps {
  folder: {
    _id: Id<'folders'>
    name: string
    updatedAt: number
  }
  threads: Array<{
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
  }>
  isExpanded?: boolean
  onToggleExpand?: (folderId: Id<'folders'>) => void
  onRename?: (folderId: Id<'folders'>, newName: string) => void
  onDelete?: (folderId: Id<'folders'>) => void
  activeThreadId?: string
  onThreadDrop?: (threadId: string, folderId: Id<'folders'>) => void
  isEditing?: boolean
  onEditingChange?: (editing: boolean) => void
}

export function FolderItem({
  folder,
  threads,
  isExpanded = false,
  onToggleExpand,
  onRename,
  onDelete,
  activeThreadId,
  onThreadDrop,
  isEditing = false,
  onEditingChange,
}: FolderItemProps) {
  const [editName, setEditName] = useState(folder.name)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Sortable functionality
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Focus and select all text when entering edit mode
  React.useEffect(() => {
    if (isEditing) {
      setEditName(folder.name)
      // Use setTimeout to ensure the input is rendered before focusing
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          inputRef.current.select()
        }
      }, 0)
    }
  }, [isEditing, folder.name])

  // Real Convex mutations
  const renameFolder = useConvexMutation(api.folders.mutations.rename)
  const deleteFolder = useConvexMutation(api.folders.mutations.remove)

  const handleToggleExpand = () => {
    onToggleExpand?.(folder._id)
  }

  const handleRename = async () => {
    if (editName.trim() !== folder.name && editName.trim()) {
      try {
        await renameFolder({
          folderId: folder._id,
          name: editName.trim()
        })
        onRename?.(folder._id, editName.trim())
      } catch (error) {
        console.error('Failed to rename folder:', error)
        setEditName(folder.name) // Reset on error
        alert(error instanceof Error ? error.message : 'Failed to rename folder')
      }
    }
    onEditingChange?.(false)
  }

  const handleDelete = async () => {
    try {
      await deleteFolder({ folderId: folder._id })
      onDelete?.(folder._id)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Failed to delete folder:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete folder')
    }
  }

  const handleDoubleClick = () => {
    onEditingChange?.(true)
    setEditName(folder.name)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename()
    } else if (e.key === 'Escape') {
      onEditingChange?.(false)
      setEditName(folder.name)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const threadId = e.dataTransfer.getData('text/thread-id')
    if (threadId) {
      onThreadDrop?.(threadId, folder._id)
    }
  }

  const contextMenuItems = (
    <>
      <ContextMenuItem onClick={() => onEditingChange?.(true)}>
        <Edit2 className="mr-2 h-4 w-4" />
        Rename
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem 
        onClick={() => setShowDeleteDialog(true)}
        className="text-red-600 focus:text-red-600"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete Folder
      </ContextMenuItem>
    </>
  )

  const folderThreads = threads.filter(thread => thread.folderId === folder._id)
  const hasThreads = folderThreads.length > 0

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "transition-opacity",
          isDragging && "opacity-50"
        )}
      >
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className={cn(
                "group relative rounded-lg transition-colors",
                isDragOver && "bg-accent/50 ring-2 ring-primary/50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
            {/* Folder Header */}
            <div
              className={cn(
                "flex items-center gap-1.5 px-2 py-2 text-sm cursor-pointer rounded-lg hover:bg-accent/50 transition-colors",
                "select-none"
              )}
              onClick={handleToggleExpand}
              onDoubleClick={handleDoubleClick}
            >
              {/* Drag handle */}
              <button
                className={cn(
                  "drag-handle cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-accent transition-opacity",
                  isHovered ? "opacity-60 hover:opacity-100" : "opacity-0"
                )}
                {...attributes}
                {...listeners}
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-3 w-3 text-muted-foreground" />
              </button>

              {/* Expand/Collapse chevron */}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleExpand()
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>

              {/* Folder icon */}
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 text-blue-500 flex-shrink-0" />
              ) : (
                <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
              )}

              {/* Folder name */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <Input
                    ref={inputRef}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={handleKeyDown}
                    className="h-6 px-1 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate" title={folder.name}>
                    {folder.name}
                  </span>
                )}
              </div>

              {/* Thread count */}
              {hasThreads && (
                <span className="text-xs text-muted-foreground bg-accent/50 rounded-full px-2 py-0.5 min-w-[1.25rem] text-center">
                  {folderThreads.length}
                </span>
              )}

              {/* Hover actions */}
              {!isEditing && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-6 w-6 p-0 transition-opacity",
                        isHovered ? "opacity-100" : "opacity-0"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditingChange?.(true)
                      }}
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDeleteDialog(true)
                      }}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Folder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Folder Contents */}
            {isExpanded && (
              <div className="ml-3 border-l border-border/40 pl-2 py-1 space-y-1">
                {folderThreads.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-2 px-2 italic">
                    No threads in this folder
                  </div>
                ) : (
                  folderThreads.map(thread => (
                    <ThreadItem
                      key={thread._id}
                      thread={thread}
                      isActive={thread.threadId === activeThreadId}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {contextMenuItems}
        </ContextMenuContent>
      </ContextMenu>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the folder "{folder.name}"? 
              All threads in this folder will be moved back to the main list. This action cannot be undone.
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
              Delete Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 