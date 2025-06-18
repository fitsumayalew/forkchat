// React import not needed with new JSX transform
import { useRef, useEffect, useState } from 'react'
import { MarkdownContent } from './MarkdownContent'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronDown } from 'lucide-react'
import { Id } from '../../../convex/_generated/dataModel'

interface MessagePart {
  type: 'text' | 'reasoning'
  text: string
}

interface Message {
  messageId: string
  role: 'user' | 'assistant'
  parts: MessagePart[]
  status?: 'waiting' | 'thinking' | 'streaming' | 'done' | 'error' | 'error.rejected'
  attachmentIds?: Id<"attachments">[]
  model?: string
  created_at: number
  serverError?: {
    type: string
    message: string
  }
}

interface ChatListProps {
  messages: Message[]
  onCopy?: (text: string) => void
  onBranch?: (messageId: string) => void
  onRetry?: (messageId: string) => void
  onEdit?: (messageId: string) => void
}

export function ChatList({ messages, onCopy, onBranch, onRetry, onEdit }: ChatListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)

  // Auto-scroll to bottom when new messages arrive (only if already at bottom)
  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages, autoScroll])

  // Handle scroll position to show/hide scroll to bottom button
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
    if (!scrollContainer) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      
      setShowScrollToBottom(!isNearBottom)
      setAutoScroll(isNearBottom)
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToBottom = () => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-lg font-medium mb-2">No messages yet</div>
          <div className="text-sm">Start a conversation by sending a message below.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      <ScrollArea ref={scrollAreaRef} className="h-full">
        <div className="p-4 space-y-4">
          {messages.map((message) => (
            <MarkdownContent
              key={message.messageId}
              message={message}
              onCopy={onCopy}
              onBranch={onBranch}
              onRetry={onRetry}
              onEdit={onEdit}
            />
          ))}
        </div>
      </ScrollArea>
      
      {/* Scroll to bottom indicator */}
      {showScrollToBottom && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-10">
          <Button
            onClick={scrollToBottom}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2 bg-background/90 dark:bg-background/90 backdrop-blur-sm border border-border/40 shadow-lg hover:bg-background/95 dark:hover:bg-background/95"
          >
            <ChevronDown className="h-4 w-4" />
            Scroll to bottom
          </Button>
        </div>
      )}
    </div>
  )
}
