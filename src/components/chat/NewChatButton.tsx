import { Plus } from "lucide-react";
import { Button } from "../ui/button";

interface NewChatButtonProps {
  onClick: () => void
  className?: string
}

const SAMPLE_MARKDOWN = `# Welcome to Enhanced ForkChat! 🚀

This chat interface now features **significantly improved** markdown and code highlighting capabilities.

## Features Overview

### 🎨 Enhanced Code Highlighting
- **Shiki-powered** syntax highlighting with 100+ languages
- **Line numbers** for better readability
- **Diff highlighting** for code changes
- **Copy & download** functionality
- **Automatic theme switching** (light/dark)

\`\`\`typescript
// TypeScript example with enhanced highlighting
interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

const processMessage = async (message: ChatMessage): Promise<void> => {
  // Advanced syntax highlighting in action!
  console.log(\`Processing message: \${message.content}\`)
}
\`\`\`

### 📊 Interactive Tables
Tables now have search, sort, and export capabilities:

| Feature | Status | Priority |
|---------|--------|----------|
| Search | ✅ Complete | High |
| Sort | ✅ Complete | High |
| Export | ✅ Complete | Medium |
| Filter | 🔄 In Progress | Low |

### 📈 Mermaid Diagrams
Create beautiful diagrams directly in markdown:

\`\`\`mermaid
graph TD
    A[User Input] --> B{Process Request}
    B -->|Valid| C[Generate Response]
    B -->|Invalid| D[Show Error]
    C --> E[Display Result]
    D --> E
\`\`\`

### 💡 Enhanced Callouts

> [!NOTE]
> This is a note callout with improved styling and icons.

> [!WARNING]
> Important warnings are now more visible and accessible.

> [!TIP]
> Pro tips stand out with beautiful styling and clear visual hierarchy.

### 🔗 Better Links & Typography
Links now have [enhanced hover states](https://example.com) and improved accessibility.

### ⚡ Performance Improvements
- **Caching** for syntax highlighting
- **Lazy loading** for large code blocks
- **Optimized rendering** for better performance

---

**Ready to experience the enhanced chat interface?** Start typing your message below!
`

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