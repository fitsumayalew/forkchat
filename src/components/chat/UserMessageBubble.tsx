// React import not needed with new JSX transform
import { useState } from 'react'
import { MessageActions } from './MessageActions'
import { AttachmentDisplay } from './AttachmentDisplay'
import { Button } from '../ui/button'
import { Id } from '../../../convex/_generated/dataModel'

interface UserMessageBubbleProps {
  content: string
  messageId: string
  attachmentIds?: Id<"attachments">[]
  timestamp: number
  onCopy?: (text: string) => void
  onRetry?: (messageId: string) => void
  onEdit?: (messageId: string) => void
  onEditSave?: (messageId: string, newContent: string, model?: string) => void
}

export function UserMessageBubble({ 
  content, 
  messageId, 
  attachmentIds, 
  timestamp, 
  onCopy,
  onRetry,
  onEdit,
  onEditSave
}: UserMessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)

  const handleEdit = () => {
    setIsEditing(true)
    setEditedContent(content)
    onEdit?.(messageId)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedContent(content)
  }

  const handleSave = async () => {
    if (onEditSave && editedContent.trim()) {
      try {
        await onEditSave(messageId, editedContent.trim())
        setIsEditing(false)
      } catch (error) {
        console.error('Failed to save edit:', error)
        // Keep editing mode open on error
      }
    }
  }

  return (
    <div className="w-full mb-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-end">
          <div className="max-w-[80%] min-w-0 group">
            {/* Message content - either editable textarea or rendered content */}
            {isEditing ? (
              <div className="bg-blue-500 text-white rounded-lg px-4 py-3">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full min-h-[100px] bg-transparent border-none outline-none resize-none text-white placeholder-blue-200 break-words"
                  autoFocus
                  placeholder="Edit your message..."
                />
              </div>
            ) : (
              <div className="bg-blue-500 text-white rounded-lg px-4 py-3 overflow-hidden">
                <div className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{content}</div>
              </div>
            )}

            {/* Attachments */}
            {attachmentIds && attachmentIds.length > 0 && (
              <div className="mt-3">
                <AttachmentDisplay attachmentIds={attachmentIds} />
              </div>
            )}
            
            {/* Action buttons and timestamp on same line, right-aligned */}
            <div className="mt-2 flex items-center justify-end gap-3">
              {/* Action buttons - different based on edit mode */}
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="h-8 px-3 text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSave}
                    className="h-8 px-3 text-muted-foreground hover:text-foreground"
                    disabled={!editedContent.trim()}
                  >
                    Save & Submit
                  </Button>
                </div>
              ) : (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <MessageActions
                    messageId={messageId}
                    content={content}
                    type="user"
                    canBranch={false}
                    canRetry={true}
                    onCopy={onCopy}
                    onRetry={onRetry}
                    onEdit={handleEdit}
                  />
                </div>
              )}

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