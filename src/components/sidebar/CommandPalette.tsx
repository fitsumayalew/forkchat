import  { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { MessageSquare, Hash, Clock, Pin } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '../ui/command'
import { api } from '../../../convex/_generated/api'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigateToThread?: (threadId: string) => void
}

export function CommandPalette({ open, onOpenChange, onNavigateToThread }: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  // Real Convex search query  
  const searchResults = useQuery({
    ...convexQuery(api.threads.queries.search, { searchTerm: searchQuery }),
    enabled: !!searchQuery.trim(),
  })

  const handleSelectThread = (threadId: string) => {
    onNavigateToThread?.(threadId)
    onOpenChange(false)
    setSearchQuery('')
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

  const results = searchResults?.data

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('')
    }
  }, [open])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search threads and messages..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>
          {searchQuery ? 'No results found.' : 'Start typing to search...'}
        </CommandEmpty>

        {results && results.length > 0 && (
          <>
            <CommandGroup heading="Threads">
              {results.map((thread) => (
                <CommandItem
                  key={thread._id}
                  value={`thread-${thread.threadId}`}
                  onSelect={() => handleSelectThread(thread.threadId)}
                  className="flex items-center gap-2 p-3"
                >
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {thread.pinned && (
                        <Pin className="h-3 w-3 text-yellow-500" />
                      )}
                      <span className="truncate font-medium">
                        {thread.title}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Updated {formatRelativeTime(thread.updatedAt)}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {results && results.length > 0 && (
          <>
            {results && results.length > 0 && <CommandSeparator />}
            <CommandGroup heading="Messages">
              {results.map((message) => (
                <CommandItem
                  key={message._id}
                  value={`message-${message._id}`}
                  onSelect={() => handleSelectThread(message.threadId)}
                  className="flex items-center gap-2 p-3"
                >
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {message.title}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {/* TODO: Add message content */}
                      {/* {message.slice(0, 50)}... */}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {formatRelativeTime(message._creationTime)}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Quick Actions */}
        {!searchQuery && (
          <CommandGroup heading="Quick Actions">
            <CommandItem
              value="new-chat"
              onSelect={() => {
                navigate({ to: '/' })
                onOpenChange(false)
              }}
              className="flex items-center gap-2 p-3"
            >
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span>New Chat</span>
              <div className="ml-auto text-xs text-muted-foreground">
                ⌘+Shift+O
              </div>
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}

// Hook to manage keyboard shortcuts
export function useCommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    open,
    setOpen,
    onOpenChange: setOpen,
  }
} 