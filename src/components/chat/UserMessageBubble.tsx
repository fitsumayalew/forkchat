// React import not needed with new JSX transform
import { MessageActions } from './MessageActions'
import { AttachmentDisplay } from './AttachmentDisplay'
import { Id } from '../../../convex/_generated/dataModel'

interface UserMessageBubbleProps {
  content: string
  messageId: string
  attachmentIds?: Id<"attachments">[]
  timestamp: number
  onCopy?: (text: string) => void
  onRetry?: (messageId: string) => void
  onEdit?: (messageId: string) => void
}

export function UserMessageBubble({ 
  content, 
  messageId, 
  attachmentIds, 
  timestamp, 
  onCopy,
  onRetry,
  onEdit
}: UserMessageBubbleProps) {
  return (
    <div className="w-full mb-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-end">
          <div className="max-w-[80%] group">
            {/* Message content */}
            <div className="bg-blue-500 text-white rounded-lg px-4 py-3">
              <div className="whitespace-pre-wrap">{content}</div>
            </div>

            {/* Attachments */}
            {attachmentIds && attachmentIds.length > 0 && (
              <div className="mt-3">
                <AttachmentDisplay attachmentIds={attachmentIds} />
              </div>
            )}
            
            {/* Action buttons and timestamp on same line, right-aligned */}
            <div className="mt-2 flex items-center justify-end gap-3">
              {/* Action buttons first - visible on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <MessageActions
                  messageId={messageId}
                  content={content}
                  type="user"
                  canBranch={false}
                  canRetry={true}
                  onCopy={onCopy}
                  onRetry={onRetry}
                  onEdit={onEdit}
                />
              </div>

              {/* Timestamp after buttons */}
              <span className="text-xs text-muted-foreground">
                {new Date(timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 