import React from 'react'
import { useAction } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, FileText, MessageSquare } from 'lucide-react'
import { MarkdownRenderer } from './MarkdownRenderer'

interface SummaryDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  threadId: string
}

export function SummaryDialog({ isOpen, onOpenChange, threadId }: SummaryDialogProps) {
  const [summary, setSummary] = React.useState<{
    summary: string
    threadTitle: string
    messageCount: number
  } | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const generateSummary = useAction(api.threads.mutations.generateSummary)

  const handleGenerateSummary = async () => {
    if (!threadId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await generateSummary({ threadId })
      setSummary(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  // Generate summary when dialog opens
  React.useEffect(() => {
    if (isOpen && !summary && !loading) {
      handleGenerateSummary()
    }
  }, [isOpen])

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      setSummary(null)
      setError(null)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Chat Summary
          </DialogTitle>
          <DialogDescription>
            AI-generated summary of your conversation
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">
                  Generating summary with Gemini 2.0 Flash...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <p className="text-destructive text-center">{error}</p>
              <Button onClick={handleGenerateSummary} variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {summary && (
            <div className="space-y-4">
              {/* Summary Header */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">{summary.threadTitle}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {summary.messageCount} messages
                  </div>
                </div>
              </div>

              {/* Summary Content */}
              <ScrollArea className="h-[400px] pr-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <MarkdownRenderer content={summary.summary} />
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          {summary && (
            <Button onClick={handleGenerateSummary} variant="outline">
              Regenerate Summary
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 