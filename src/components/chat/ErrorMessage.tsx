// React import not needed with new JSX transform
import { AlertCircle } from 'lucide-react'

interface ErrorMessageProps {
  errorType: string
  errorMessage: string
}

export function ErrorMessage({ errorType, errorMessage }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-sm font-medium text-red-800 dark:text-red-200">
            Error: {errorType}
          </div>
          <div className="text-sm text-red-700 dark:text-red-300 mt-1">
            {errorMessage}
          </div>
        </div>
      </div>
    </div>
  )
} 