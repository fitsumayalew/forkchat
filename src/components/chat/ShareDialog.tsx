import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Button } from '../ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '../ui/dialog'
import { Copy, Share2, Check, Globe, Lock } from 'lucide-react'

interface ShareDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  threadId: string
}

export function ShareDialog({ isOpen, onOpenChange, threadId }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)
  const toggleShare = useMutation(api.threads.mutations.toggleShare)
  
  // Get current thread to check if it's public
  const thread = useQuery(api.threads.queries.get)?.find(t => t.threadId === threadId)
  const isPublic = thread?.isPublic || false

  const shareUrl = `${window.location.origin}/share/${threadId}`

  const handleToggleShare = async () => {
    try {
      await toggleShare({ threadId })
    } catch (error) {
      console.error('Failed to toggle share:', error)
    }
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Chat
          </DialogTitle>
          <DialogDescription>
            Make this conversation publicly accessible via a link.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Toggle sharing */}
          <div className="flex items-start justify-between p-4 border rounded-lg gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="shrink-0 mt-0.5">
                {isPublic ? (
                  <Globe className="w-5 h-5 text-green-600" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm">
                  {isPublic ? 'Public Access' : 'Private Chat'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {isPublic 
                    ? 'Anyone with the link can view this chat'
                    : 'Only you can access this chat'
                  }
                </div>
              </div>
            </div>
            <Button
              variant={isPublic ? "outline" : "default"}
              size="sm"
              onClick={handleToggleShare}
              className="shrink-0"
            >
              {isPublic ? 'Make Private' : 'Make Public'}
            </Button>
          </div>

          {/* Share URL (only visible when public) */}
          {isPublic && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Share Link</label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 text-sm bg-muted/50 border rounded-lg font-mono text-muted-foreground break-all">
                    {shareUrl}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyUrl}
                    className="shrink-0 h-11"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {copied && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Link copied to clipboard!
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Warning message */}
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Important:</strong> Shared chats are publicly accessible. Anyone with the link can view the entire conversation history. Do not share sensitive information.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 