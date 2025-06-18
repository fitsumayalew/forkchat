// React import not needed with new JSX transform
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { MessageInput } from './MessageInput'
import { ChatList } from './ChatList'
import { Icon } from '../Icon'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'

interface ChatInterfaceProps {
  threadId?: string
}

// Type to match the actual database message structure
interface DatabaseMessage {
  _id: string
  messageId: string
  role: 'user' | 'assistant' | 'system'
  parts?: Array<{
    type: 'text' | 'reasoning' | 'tool_call'
    text?: string
    reasoning?: string
    result?: any
    status?: 'pending' | 'completed' | 'failed'
    toolCallId?: string
    toolName?: string
    args?: any
  }>
  status?: 'waiting' | 'thinking' | 'streaming' | 'done' | 'error' | 'error.rejected' | 'deleted' | 'cancelled'
  attachmentIds?: string[]
  model?: string
  created_at: number
  reasoning?: string
  serverError?: {
    type: string
    message: string
  }
}

// Convert database message to our component message format
const convertMessage = (dbMessage: DatabaseMessage) => {
  return {
    messageId: dbMessage.messageId,
    role: dbMessage.role === 'system' ? 'assistant' : dbMessage.role as 'user' | 'assistant',
    parts: dbMessage.parts?.map(part => ({
      type: part.type === 'tool_call' ? 'text' : (part.type as 'text' | 'reasoning'),
      text: part.text || part.reasoning || ''
    })) || [],
    status: dbMessage.status && ['waiting', 'thinking', 'streaming', 'done', 'error', 'error.rejected'].includes(dbMessage.status) 
      ? dbMessage.status as 'waiting' | 'thinking' | 'streaming' | 'done' | 'error' | 'error.rejected'
      : undefined,
    attachmentIds: dbMessage.attachmentIds as Id<"attachments">[] | undefined,
    model: dbMessage.model,
    created_at: dbMessage.created_at,
    serverError: dbMessage.serverError,
  }
}

export function ChatInterface({ threadId }: ChatInterfaceProps) {
  // Fetch messages for the thread if threadId is provided
  const messagesQuery = useQuery({
    ...convexQuery(api.messages.queries.getByThreadId, { 
      threadId: threadId || '' 
    }),
    enabled: !!threadId,
  })

  // If no threadId, show the welcome screen
  if (!threadId) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        {/* Main welcome area - scrollable if needed */}
        <div className="flex-1 min-h-0 flex items-center justify-center p-8 overflow-y-auto">
          <div className="text-center max-w-md">
            <div className="mb-4 flex justify-center">
              <div className="h-16 w-16">
                <Icon />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-foreground dark:text-foreground mb-2">
              Welcome to ForkChat
            </h1>
            <p className="text-muted-foreground dark:text-muted-foreground">
              Start a conversation with your AI assistant. Ask questions, get help with coding, 
              writing, analysis, and more.
            </p>
          </div>
        </div>

        {/* Fixed floating message input area */}
        <div className="sticky bottom-0 z-40 shrink-0 bg-background/80 dark:bg-background/80 backdrop-blur-md border-t border-border/40 dark:border-border/40 shadow-lg p-4">
          <MessageInput />
        </div>
      </div>
    )
  }

  // Handle message actions (simplified for now)
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleBranch = (messageId: string) => {
    console.log('Branch message:', messageId)
    // TODO: Implement branching functionality
  }

  const handleRetry = (messageId: string) => {
    console.log('Retry message:', messageId)
    // TODO: Implement retry functionality
  }

  const handleEdit = (messageId: string) => {
    console.log('Edit message:', messageId)
    // TODO: Implement edit functionality
  }

  // Convert database messages to component format
  const messages = messagesQuery.data ? 
    messagesQuery.data.map(convertMessage) : []

  // If threadId is provided, show the chat messages
  return (
    <div className="flex flex-col flex-1 min-h-0 relative">
      {/* Messages area - scrollable with padding for floating input */}
      <div className="flex-1 min-h-0 overflow-hidden pb-24">
        {messagesQuery.isLoading ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="text-lg font-medium mb-2">Loading messages...</div>
            </div>
          </div>
        ) : messagesQuery.error ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center text-red-500">
              <div className="text-lg font-medium mb-2">Error loading messages</div>
              <div className="text-sm">{String(messagesQuery.error)}</div>
            </div>
          </div>
        ) : (
          <ChatList
            messages={messages}
            onCopy={handleCopy}
            onBranch={handleBranch}
            onRetry={handleRetry}
            onEdit={handleEdit}
          />
        )}
      </div>

      {/* Fixed floating message input area */}
      <div className="absolute bottom-0 left-0 right-0 z-40  p-4">
        <MessageInput threadId={threadId} />
      </div>
    </div>
  )
} 