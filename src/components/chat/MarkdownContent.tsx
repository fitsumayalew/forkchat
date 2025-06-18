// React import not needed with new JSX transform
import { UserMessageBubble } from './UserMessageBubble'
import { AssistantMessageBubble } from './AssistantMessageBubble'
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

interface MarkdownContentProps {
  message: Message
  onCopy?: (text: string) => void
  onBranch?: (messageId: string) => void
  onRetry?: (messageId: string) => void
  onEdit?: (messageId: string) => void
  onEditSave?: (messageId: string, newContent: string, model?: string) => void
  readOnlyMode?: boolean
}

export function MarkdownContent({ 
  message, 
  onCopy, 
  onBranch, 
  onRetry,
  onEdit,
  onEditSave,
  readOnlyMode = false
}: MarkdownContentProps) {
  if (message.role === 'user') {
    return (
      <UserMessageBubble
        content={message.parts?.[0]?.text || ''}
        messageId={message.messageId}
        attachmentIds={message.attachmentIds}
        timestamp={message.created_at}
        onCopy={onCopy}
        onRetry={onRetry}
        onEdit={onEdit}
        onEditSave={onEditSave}
        readOnlyMode={readOnlyMode}
      />
    )
  }

  if (message.role === 'assistant') {
    return (
      <AssistantMessageBubble
        message={message}
        onCopy={onCopy}
        onBranch={onBranch}
        onRetry={onRetry}
        readOnlyMode={readOnlyMode}
      />
    )
  }

  return null
} 