// React import not needed with new JSX transform
import { MarkdownRenderer } from './MarkdownRenderer'
import { ReasoningComponent } from './ReasoningComponent'
import { ErrorMessage } from './ErrorMessage'
import { MessageActions } from './MessageActions'
import { AttachmentDisplay } from './AttachmentDisplay'
import { Id } from '../../../convex/_generated/dataModel'
import { models } from '../../lib/models'

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

interface AssistantMessageBubbleProps {
  message: Message
  onCopy?: (text: string) => void
  onBranch?: (messageId: string) => void
  onRetry?: (messageId: string) => void
  readOnlyMode?: boolean
}

export function AssistantMessageBubble({ 
  message, 
  onCopy, 
  onBranch, 
  onRetry,
  readOnlyMode = false
}: AssistantMessageBubbleProps) {
  const isError = message.status === 'error' || message.status === 'error.rejected'
  const isGenerating = ['waiting', 'thinking', 'streaming'].includes(message.status || '')

  // Get all text content for copy functionality
  const getAllTextContent = () => {
    return message.parts
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join('\n\n')
  }

  // Get the model display name from the models object
  const getModelDisplayName = (modelId?: string) => {
    if (!modelId) return null
    const model = models[modelId as keyof typeof models]
    return model?.name || modelId
  }

  return (
    <div className="w-full mb-6">
      <div className="max-w-3xl mx-auto">
        <div className="group">
          {/* Status indicator for generating messages */}
          {isGenerating && (
            <div className="mb-4 px-3 py-2 bg-muted/50 rounded-md border-l-2 border-primary/50">
              <div className="text-sm text-muted-foreground italic flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse"></div>
                {message.status === 'waiting' && 'Waiting...'}
                {message.status === 'thinking' && 'Thinking...'}
                {message.status === 'streaming' && 'Generating...'}
              </div>
            </div>
          )}

          {/* Error message */}
          {isError && message.serverError && (
            <div className="mb-4">
              <ErrorMessage 
                errorType={message.serverError.type}
                errorMessage={message.serverError.message}
              />
            </div>
          )}

          {/* Message content - document-like styling */}
          {message.parts && message.parts.length > 0 && (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="space-y-4">
                {message.parts.map((part, index) => (
                  <div key={index}>
                    {part.type === 'text' && (
                      <MarkdownRenderer content={part.text} />
                    )}
                    {part.type === 'reasoning' && (
                      <ReasoningComponent content={part.text} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {message.attachmentIds && message.attachmentIds.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/30">
              <AttachmentDisplay attachmentIds={message.attachmentIds} />
            </div>
          )}

          {/* Timestamp, model info, and action buttons on same line */}
          <div className="mt-3 flex items-center gap-3">
            {/* Left side: timestamp and model */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{new Date(message.created_at).toLocaleTimeString()}</span>
              {message.model && (
                <>
                  <span>•</span>
                  <span className="px-2 py-1 bg-muted rounded-md font-medium">
                    {getModelDisplayName(message.model)}
                  </span>
                </>
              )}
            </div>

            {/* Right side: action buttons - only visible on hover */}
            {!isGenerating && !readOnlyMode && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <MessageActions
                  messageId={message.messageId}
                  content={getAllTextContent()}
                  type="assistant"
                  canBranch={true}
                  canRetry={true}
                  onCopy={onCopy}
                  onBranch={onBranch}
                  onRetry={onRetry}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 