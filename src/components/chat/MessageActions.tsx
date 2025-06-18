import { useState } from 'react'
import { Button } from '../ui/button'
import { Copy, GitBranch, RotateCcw, Check, Edit, MoreHorizontal } from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu'

interface MessageActionsProps {
  messageId: string
  content: string
  type?: 'assistant' | 'user'
  canBranch?: boolean
  canRetry?: boolean
  onCopy?: (text: string) => void
  onBranch?: (messageId: string) => void
  onRetry?: (messageId: string) => void
  onEdit?: (messageId: string) => void
  readOnlyMode?: boolean
}

export function MessageActions({ 
  messageId, 
  content, 
  type = 'assistant',
  canBranch = true, 
  canRetry = false,
  onCopy, 
  onBranch, 
  onRetry,
  onEdit,
  readOnlyMode = false
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      if (onCopy) {
        onCopy(content)
      } else {
        await navigator.clipboard.writeText(content)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy message:', err)
    }
  }

  const handleBranch = () => {
    if (onBranch) {
      onBranch(messageId)
    }
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry(messageId)
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(messageId)
    }
  }

  // For assistant messages, show buttons inline (not in dropdown)
  if (type === 'assistant') {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 px-3 text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </>
          )}
        </Button>
        
        {!readOnlyMode && canBranch && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBranch}
            className="h-8 px-3 text-muted-foreground hover:text-foreground"
          >
            <GitBranch className="h-3 w-3 mr-1" />
            Branch
          </Button>
        )}
        
        {!readOnlyMode && canRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            className="h-8 px-3 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    )
  }

  // For user messages, show buttons inline as well
  if (type === 'user') {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 px-3 text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </>
          )}
        </Button>
        
        {!readOnlyMode && onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-8 px-3 text-muted-foreground hover:text-foreground"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
        )}
        
        {!readOnlyMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            className="h-8 px-3 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    )
  }

  // Fallback dropdown menu (legacy support)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-2" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-2" />
              Copy
            </>
          )}
        </DropdownMenuItem>
        
        {!readOnlyMode && canBranch && (
          <DropdownMenuItem onClick={handleBranch} className="cursor-pointer">
            <GitBranch className="h-3 w-3 mr-2" />
            Branch
          </DropdownMenuItem>
        )}
        
        {!readOnlyMode && canRetry && (
          <DropdownMenuItem onClick={handleRetry} className="cursor-pointer">
            <RotateCcw className="h-3 w-3 mr-2" />
            Retry
          </DropdownMenuItem>
        )}

        {!readOnlyMode && onEdit && (
          <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
            <Edit className="h-3 w-3 mr-2" />
            Edit
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 