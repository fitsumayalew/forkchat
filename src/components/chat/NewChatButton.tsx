import { Plus } from "lucide-react";
import { Button } from "../ui/button";

interface NewChatButtonProps {
  onClick: () => void
  className?: string
}



export function NewChatButton({ onClick, className = '' }: NewChatButtonProps) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] p-8 ${className}`}>
      <div className="text-center space-y-6 max-w-2xl">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Start a new conversation
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Experience enhanced markdown rendering and syntax highlighting
          </p>
        </div>
        
        <Button 
          onClick={onClick}
          size="lg"
          className="px-8 py-3 text-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Chat
        </Button>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          <p>Features: Enhanced code highlighting • Interactive tables • Mermaid diagrams • Improved accessibility</p>
        </div>
      </div>
    </div>
  )
}