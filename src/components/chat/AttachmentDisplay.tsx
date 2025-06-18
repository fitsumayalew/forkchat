// React import not needed with new JSX transform
import { Paperclip, FileText, Image, File } from 'lucide-react'
import { useConvexQuery } from '@convex-dev/react-query'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'

interface AttachmentDisplayProps {
  attachmentIds: Id<"attachments">[]
}

export function AttachmentDisplay({ attachmentIds }: AttachmentDisplayProps) {
  const attachments = useConvexQuery(
    api.attachments.queries.getAttachments,
    attachmentIds && attachmentIds.length > 0 ? { attachmentIds } : "skip"
  )

  if (!attachmentIds || attachmentIds.length === 0) {
    return null
  }

  if (!attachments) {
    return null
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4" />
    }
    if (mimeType === 'application/pdf') {
      return <FileText className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
        <Paperclip className="h-3 w-3" />
        <span>Attachments ({attachments.length})</span>
      </div>
      
      <div className="grid gap-2">
        {attachments.map((attachment) => {
          if (!attachment) return null
          
          return (
            <div
              key={attachment._id}
              className="flex items-center gap-3 p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                {getFileIcon(attachment.mimeType)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {attachment.fileName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {attachment.mimeType}
                  {attachment.fileSize && ` • ${formatFileSize(attachment.fileSize)}`}
                </div>
              </div>
              
              {attachment.url && (
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View
                </a>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
} 