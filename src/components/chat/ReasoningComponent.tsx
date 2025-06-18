import { useState } from 'react'
import { ChevronDown, ChevronRight, Brain } from 'lucide-react'
import { Button } from '../ui/button'

interface ReasoningComponentProps {
  content: string
}

export function ReasoningComponent({ content }: ReasoningComponentProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border border-blue-200 dark:border-blue-800 rounded-lg my-3">
      {/* Header */}
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-start p-3 h-auto hover:bg-blue-50 dark:hover:bg-blue-900/20"
      >
        <Brain className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
          AI Reasoning
        </span>
        <div className="ml-auto">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          )}
        </div>
      </Button>

      {/* Content */}
      {isExpanded && (
        <div className="px-3 pb-3">
          <div className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/10 p-3 rounded border-l-4 border-blue-300 dark:border-blue-600">
            <div className="whitespace-pre-wrap font-mono text-xs">
              {content}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 