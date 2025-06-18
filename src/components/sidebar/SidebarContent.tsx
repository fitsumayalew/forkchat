import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { 
  Search, 
  FolderPlus, 
  X,
  Sparkles,
  MessageSquare,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { Separator } from '../ui/separator'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { ScrollArea } from '../ui/scroll-area'
import { ThreadItem } from './ThreadItem'
import { FolderItem } from './FolderItem'
import { CommandPalette, useCommandPalette } from './CommandPalette'
import { Icon } from '../Icon'

interface SidebarContentProps {
  activeThreadId?: string
}

export function SidebarContent({ activeThreadId }: SidebarContentProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<Id<'folders'>>>(new Set())
  const [isFoldersCollapsed, setIsFoldersCollapsed] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [dragOverSection, setDragOverSection] = useState<string | null>(null)
  const commandPalette = useCommandPalette()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Real Convex API calls
  const threadsQuery = useQuery(convexQuery(api.threads.queries.get, {}))
  const foldersQuery = useQuery(convexQuery(api.folders.queries.get, {}))
  
  const isLoading = threadsQuery.isLoading || foldersQuery.isLoading
  const hasError = threadsQuery.error || foldersQuery.error

  // Mutations for folder operations
  const createFolder = useConvexMutation(api.folders.mutations.create)
  
  // Regular Convex mutation for folder reordering 
  const bulkReorderFoldersConvex = useConvexMutation(api.folders.mutations.bulkReorder)
  
  // Optimistic folder reordering mutation
  const bulkReorderFolders = useMutation({
    mutationFn: async (updates: Array<{ folderId: Id<'folders'>; order: number }>) => {
      return await bulkReorderFoldersConvex({ updates })
    },
    onMutate: async (updates) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      const queryKey = convexQuery(api.folders.queries.get, {}).queryKey
      await queryClient.cancelQueries({ queryKey })

      // Snapshot the previous value
      const previousFolders = queryClient.getQueryData(queryKey)

      // Optimistically update to the new value
      if (previousFolders) {
        const optimisticFolders = (previousFolders as typeof folders).map(folder => {
          const update = updates.find((u: { folderId: Id<'folders'>; order: number }) => u.folderId === folder._id)
          return update ? { ...folder, order: update.order } : folder
        }).sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order
          }
          if (a.order !== undefined && b.order === undefined) {
            return -1
          }
          if (a.order === undefined && b.order !== undefined) {
            return 1
          }
          return b._creationTime - a._creationTime
        })
        
        queryClient.setQueryData(queryKey, optimisticFolders)
      }

      // Return a context object with the snapshotted value
      return { previousFolders, queryKey }
    },
    onError: (_, __, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousFolders) {
        queryClient.setQueryData(context.queryKey, context.previousFolders)
      }
    },
    onSettled: () => {
      // Always refetch after error or success to sync with server state
      const queryKey = convexQuery(api.folders.queries.get, {}).queryKey
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const threads = threadsQuery.data || []
  const folders = foldersQuery.data || []

  // Filter threads based on search query
  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads
    
    return threads.filter(thread =>
      thread.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [threads, searchQuery])

  // Group threads
  const { pinnedThreads, folderThreads, ungroupedThreads } = useMemo(() => {
    const pinned = filteredThreads
      .filter(thread => thread.pinned && !thread.folderId)
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt) // Sort pinned by most recent
    const inFolders = filteredThreads.filter(thread => thread.folderId)
    const ungrouped = filteredThreads.filter(thread => !thread.pinned && !thread.folderId)
    
    return {
      pinnedThreads: pinned,
      folderThreads: inFolders,
      ungroupedThreads: ungrouped,
    }
  }, [filteredThreads])

  // Group ungrouped threads by time
  const groupedThreads = useMemo(() => {
    const now = Date.now()
    const groups = {
      today: [] as typeof ungroupedThreads,
      yesterday: [] as typeof ungroupedThreads,
      lastWeek: [] as typeof ungroupedThreads,
      lastMonth: [] as typeof ungroupedThreads,
      older: [] as typeof ungroupedThreads,
    }

    ungroupedThreads.forEach(thread => {
      const age = now - thread.lastMessageAt
      const hours = age / (1000 * 60 * 60)
      const days = age / (1000 * 60 * 60 * 24)

      if (hours < 24) {
        groups.today.push(thread)
      } else if (days < 2) {
        groups.yesterday.push(thread)
      } else if (days < 7) {
        groups.lastWeek.push(thread)
      } else if (days < 30) {
        groups.lastMonth.push(thread)
      } else {
        groups.older.push(thread)
      }
    })

    return groups
  }, [ungroupedThreads])

  const handleNewChat = useCallback(() => {
    // Navigate to home page which will show the welcome screen with new chat input
    navigate({ to: '/' })
  }, [navigate])

  const [editingFolderId, setEditingFolderId] = useState<Id<'folders'> | null>(null)

  const handleCreateFolder = useCallback(async () => {
    try {
      const result = await createFolder({
        name: 'Untitled'
      })
      // Ensure folders section is expanded when creating a new folder
      setIsFoldersCollapsed(false)
      // Put the newly created folder in edit mode and expand it
      setEditingFolderId(result.folderId)
      setExpandedFolders(prev => new Set(prev).add(result.folderId))
    } catch (error) {
      console.error('Failed to create folder:', error)
      alert(error instanceof Error ? error.message : 'Failed to create folder')
    }
  }, [createFolder])

  const handleToggleFolderExpand = useCallback((folderId: Id<'folders'>) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }, [])

  // Convex mutation to update a thread
  const updateThreadFolder = useConvexMutation(api.threads.mutations.update)

  const handleThreadDrop = useCallback(async (threadId: string, folderId: Id<'folders'>) => {
    try {
      await updateThreadFolder({
        threadId,
        updates: { folderId },
      })
    } catch (error) {
      console.error('Failed to move thread:', error)
      alert(error instanceof Error ? error.message : 'Failed to move thread')
    }
  }, [updateThreadFolder])

  const handleNavigateToThread = useCallback((threadId: string) => {
    navigate({ to: '/chat/$threadId', params: { threadId } })
  }, [navigate])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  // HTML5 drag and drop handlers for removing threads from folders
  const createSectionHandlers = useCallback((sectionId: string) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setDragOverSection(sectionId)
    },
    onDragLeave: (e: React.DragEvent) => {
      // Only clear if we're actually leaving the section (not just moving to a child)
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setDragOverSection(null)
      }
    },
    onDrop: async (e: React.DragEvent) => {
      e.preventDefault()
      setDragOverSection(null)
      const threadId = e.dataTransfer.getData('text/thread-id')
      
      if (threadId) {
        try {
          // Remove thread from folder (set folderId to null)
          await updateThreadFolder({
            threadId,
            updates: { folderId: null },
          })
        } catch (error) {
          console.error('Failed to remove thread from folder:', error)
          alert(error instanceof Error ? error.message : 'Failed to remove thread from folder')
        }
      }
    }
  }), [updateThreadFolder])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const activeIndex = folders.findIndex(folder => folder._id === active.id)
    const overIndex = folders.findIndex(folder => folder._id === over.id)

    if (activeIndex === -1 || overIndex === -1) {
      return
    }

    // Create new order for all folders
    const reorderedFolders = arrayMove(folders, activeIndex, overIndex)
    const updates = reorderedFolders.map((folder, index) => ({
      folderId: folder._id,
      order: index,
    }))

    // Use the optimistic mutation - this will handle optimistic updates automatically
    bulkReorderFolders.mutate(updates, {
      onError: (error) => {
        console.error('Failed to reorder folders:', error)
        alert(error instanceof Error ? error.message : 'Failed to reorder folders')
      }
    })
  }, [folders, bulkReorderFolders])

  // Create a flat list of all navigable items for keyboard navigation
  const allNavigableItems = useMemo(() => {
    const items: Array<{ type: 'thread'; threadId: string }> = []
    
    // Add pinned threads
    pinnedThreads.forEach(thread => {
      items.push({ type: 'thread', threadId: thread.threadId })
    })
    
    // Add folder threads (only if folders are expanded)
    if (!isFoldersCollapsed) {
      folderThreads.forEach(thread => {
        items.push({ type: 'thread', threadId: thread.threadId })
      })
    }
    
    // Add threads from all time groups
    Object.values(groupedThreads).forEach(group => {
      group.forEach(thread => {
        items.push({ type: 'thread', threadId: thread.threadId })
      })
    })
    
    return items
  }, [pinnedThreads, folderThreads, isFoldersCollapsed, groupedThreads])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!sidebarRef.current?.contains(document.activeElement)) return
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setFocusedIndex(prev => Math.min(prev + 1, allNavigableItems.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocusedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (focusedIndex >= 0 && focusedIndex < allNavigableItems.length) {
            const item = allNavigableItems[focusedIndex]
            if (item.type === 'thread') {
              navigate({ to: '/chat/$threadId', params: { threadId: item.threadId } })
            }
          }
          break
        case 'Escape':
          setFocusedIndex(-1)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [allNavigableItems, focusedIndex, navigate])

  return (
    <div ref={sidebarRef} className="flex flex-col h-full overflow-hidden" tabIndex={0}>
      {/* Header & New Chat Controls */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8">
              <Icon />
            </div>
            <h1 className="text-lg font-semibold">ForkChat</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => commandPalette.setOpen(true)}
              className="h-8 w-8 p-0"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Button
          onClick={handleNewChat}
          className="w-full justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
        >
          <Sparkles className="h-4 w-4" />
          New Chat
          <div className="ml-auto text-xs opacity-75">⌘⇧O</div>
        </Button>
      </div>

      {/* Search & Filtering */}
      <div className="p-4 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter threads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>


      {/* Scrollable Content */}
      <ScrollArea className="flex-1 h-full">
        {isLoading ? (
          <div className="px-4 py-3 space-y-4">
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 bg-accent/20 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ) : hasError ? (
          <div className="px-4 py-3 text-center">
            <div className="text-destructive text-sm mb-2">Failed to load sidebar</div>
            <button 
              onClick={() => {
                threadsQuery.refetch()
                foldersQuery.refetch()
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="px-4 py-3 space-y-6">
          {/* Pinned Threads */}
          {pinnedThreads.length > 0 && (
            <>
              <div
                {...createSectionHandlers('pinned')}
                className={`rounded-lg transition-colors duration-150 ${
                  dragOverSection === 'pinned' 
                    ? 'bg-accent/40 ring-2 ring-blue-500/50' 
                    : 'hover:bg-accent/20'
                }`}
              >
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
                  Pinned
                </h3>
                <div className="space-y-1">
                  {pinnedThreads.map((thread) => {
                    const globalIndex = allNavigableItems.findIndex(item => item.threadId === thread.threadId)
                    return (
                      <ThreadItem
                        key={thread._id}
                        thread={thread}
                        isActive={thread.threadId === activeThreadId}
                        tabIndex={globalIndex === focusedIndex ? 0 : -1}
                      />
                    )
                  })}
                </div>
              </div>
              <Separator className="mx-1" />
            </>
          )}

          {/* Folders */}
          <>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div 
                  className="flex items-center gap-1 cursor-pointer hover:bg-accent/50 rounded px-1 py-1 -mx-1"
                  onClick={() => setIsFoldersCollapsed(!isFoldersCollapsed)}
                >
                  {isFoldersCollapsed ? (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  )}
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Folders {folders.length > 0 && `(${folders.length})`}
                    {isFoldersCollapsed && folderThreads.length > 0 && (
                      <span className="text-xs ml-1 opacity-60">• {folderThreads.length} threads</span>
                    )}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCreateFolder}
                  className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                >
                  <FolderPlus className="h-3 w-3" />
                </Button>
              </div>
              
              {!isFoldersCollapsed && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={folders.map(f => f._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1">
                      {folders.map(folder => (
                        <FolderItem
                          key={folder._id}
                          folder={folder}
                          threads={filteredThreads}
                          isExpanded={expandedFolders.has(folder._id)}
                          onToggleExpand={handleToggleFolderExpand}
                          activeThreadId={activeThreadId}
                          onThreadDrop={handleThreadDrop}
                          isEditing={editingFolderId === folder._id}
                          onEditingChange={(editing) => setEditingFolderId(editing ? folder._id : null)}
                          onRename={(_) => setEditingFolderId(null)}
                          onDelete={(_) => setEditingFolderId(null)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
            {(!isFoldersCollapsed && ungroupedThreads.length > 0) && <Separator className="mx-1" />}
          </>

          {/* Recent Chat History (Grouped by Time) */}
          <div className="space-y-5">
            {groupedThreads.today.length > 0 && (
              <div
                {...createSectionHandlers('today')}
                className={`rounded-lg transition-colors duration-150 ${
                  dragOverSection === 'today' 
                    ? 'bg-accent/40 ring-2 ring-blue-500/50' 
                    : 'hover:bg-accent/20'
                }`}
              >
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  Today
                </h3>
                <div className="space-y-1">
                  {groupedThreads.today.map(thread => {
                    const globalIndex = allNavigableItems.findIndex(item => item.threadId === thread.threadId)
                    return (
                      <ThreadItem
                        key={thread._id}
                        thread={thread}
                        isActive={thread.threadId === activeThreadId}
                        tabIndex={globalIndex === focusedIndex ? 0 : -1}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {groupedThreads.yesterday.length > 0 && (
              <div
                {...createSectionHandlers('yesterday')}
                className={`rounded-lg transition-colors duration-150 ${
                  dragOverSection === 'yesterday' 
                    ? 'bg-accent/40 ring-2 ring-blue-500/50' 
                    : 'hover:bg-accent/20'
                }`}
              >
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  Yesterday
                </h3>
                <div className="space-y-1">
                  {groupedThreads.yesterday.map(thread => {
                    const globalIndex = allNavigableItems.findIndex(item => item.threadId === thread.threadId)
                    return (
                      <ThreadItem
                        key={thread._id}
                        thread={thread}
                        isActive={thread.threadId === activeThreadId}
                        tabIndex={globalIndex === focusedIndex ? 0 : -1}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {groupedThreads.lastWeek.length > 0 && (
              <div
                {...createSectionHandlers('lastWeek')}
                className={`rounded-lg transition-colors duration-150 ${
                  dragOverSection === 'lastWeek' 
                    ? 'bg-accent/40 ring-2 ring-blue-500/50' 
                    : 'hover:bg-accent/20'
                }`}
              >
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  Last 7 Days
                </h3>
                <div className="space-y-1">
                  {groupedThreads.lastWeek.map(thread => {
                    const globalIndex = allNavigableItems.findIndex(item => item.threadId === thread.threadId)
                    return (
                      <ThreadItem
                        key={thread._id}
                        thread={thread}
                        isActive={thread.threadId === activeThreadId}
                        tabIndex={globalIndex === focusedIndex ? 0 : -1}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {groupedThreads.lastMonth.length > 0 && (
              <div
                {...createSectionHandlers('lastMonth')}
                className={`rounded-lg transition-colors duration-150 ${
                  dragOverSection === 'lastMonth' 
                    ? 'bg-accent/40 ring-2 ring-blue-500/50' 
                    : 'hover:bg-accent/20'
                }`}
              >
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  Last 30 Days
                </h3>
                <div className="space-y-1">
                  {groupedThreads.lastMonth.map(thread => {
                    const globalIndex = allNavigableItems.findIndex(item => item.threadId === thread.threadId)
                    return (
                      <ThreadItem
                        key={thread._id}
                        thread={thread}
                        isActive={thread.threadId === activeThreadId}
                        tabIndex={globalIndex === focusedIndex ? 0 : -1}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {groupedThreads.older.length > 0 && (
              <div
                {...createSectionHandlers('older')}
                className={`rounded-lg transition-colors duration-150 ${
                  dragOverSection === 'older' 
                    ? 'bg-accent/40 ring-2 ring-blue-500/50' 
                    : 'hover:bg-accent/20'
                }`}
              >
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  Older
                </h3>
                <div className="space-y-1">
                  {groupedThreads.older.map(thread => {
                    const globalIndex = allNavigableItems.findIndex(item => item.threadId === thread.threadId)
                    return (
                      <ThreadItem
                        key={thread._id}
                        thread={thread}
                        isActive={thread.threadId === activeThreadId}
                        tabIndex={globalIndex === focusedIndex ? 0 : -1}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Empty state */}
          {filteredThreads.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No threads found' : 'No conversations yet'}
              </p>
             
            </div>
          )}
          </div>
        )}
      </ScrollArea>

      {/* Command Palette */}
      <CommandPalette
        open={commandPalette.open}
        onOpenChange={commandPalette.onOpenChange}
        onNavigateToThread={handleNavigateToThread}
      />
    </div>
  )
} 