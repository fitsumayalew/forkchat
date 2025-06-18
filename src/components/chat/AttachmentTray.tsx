import { Id } from '../../../convex/_generated/dataModel'

interface Attachment {
  id: string
  file: File
  name: string
  type: string
  preview?: string
  uploading?: boolean
  uploaded?: boolean
  attachmentId?: Id<"attachments">
  error?: string
}

interface AttachmentTrayProps {
  attachments: Attachment[]
  onRemove: (id: string) => void
}

export function AttachmentTray({ attachments, onRemove }: AttachmentTrayProps) {
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return '🖼️'
    } else if (type === 'application/pdf') {
      return '📄'
    } else {
      return '📎'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIndicator = (attachment: Attachment) => {
    if (attachment.uploading) {
      return (
        <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
          <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-1"></div>
          Uploading...
        </div>
      )
    }
    
    if (attachment.error) {
      return (
        <div className="flex items-center text-xs text-red-600 dark:text-red-400">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          {attachment.error}
        </div>
      )
    }
    
    if (attachment.uploaded) {
      return (
        <div className="flex items-center text-xs text-green-600 dark:text-green-400">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          Uploaded
        </div>
      )
    }
    
    return null
  }

  return (
    <div className="px-4 py-3 border-b border-border dark:border-border bg-muted/50 dark:bg-muted/50">
      <div className="flex flex-wrap gap-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className={`flex items-center border rounded-lg px-3 py-2 max-w-xs ${
              attachment.error 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                : attachment.uploading
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : 'bg-background dark:bg-background border-border dark:border-border'
            }`}
          >
            {/* File preview or icon */}
            <div className="mr-3 flex-shrink-0">
              {attachment.preview ? (
                <img
                  src={attachment.preview}
                  alt={attachment.name}
                  className="w-8 h-8 object-cover rounded"
                />
              ) : (
                <div className="w-8 h-8 flex items-center justify-center bg-muted dark:bg-muted border border-border dark:border-border rounded">
                  <span className="text-lg">{getFileIcon(attachment.type)}</span>
                </div>
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground dark:text-foreground truncate">
                {attachment.name}
              </div>
              <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                {formatFileSize(attachment.file.size)}
              </div>
              {getStatusIndicator(attachment)}
            </div>

            {/* Remove button */}
            <button
              onClick={() => onRemove(attachment.id)}
              disabled={attachment.uploading}
              className="ml-2 p-1 text-muted-foreground hover:text-foreground hover:bg-accent dark:hover:bg-accent rounded-full transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remove attachment"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
} 