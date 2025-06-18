import React, { useEffect, useRef, useMemo, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { TableComponent } from './TableComponent'
import 'katex/dist/katex.min.css'
import { CodeBlock } from './CodeBlock'
import mermaid from 'mermaid/dist/mermaid.esm.min.mjs'
import { Hash, Info, AlertTriangle, CheckCircle, XCircle, Lightbulb } from 'lucide-react'
import type { Components } from 'react-markdown'

interface MarkdownRendererProps {
  content: string
  className?: string
}

// Type for callout types
type CalloutType = 'note' | 'info' | 'warning' | 'caution' | 'danger' | 'error' | 'success' | 'check' | 'tip'

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
})

// Simple string hash to create stable IDs for mermaid diagrams
function hashString(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

// Component for Mermaid diagrams
const MermaidDiagram = React.memo(function MermaidDiagram({ code, id }: { code: string; id: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  useEffect(() => {
    const renderDiagram = async () => {
      if (!ref.current) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        // Clear previous content
        ref.current.innerHTML = ''
        
        // Validate mermaid syntax before rendering
        const isValid = await mermaid.parse(code)
        if (!isValid) {
          throw new Error('Invalid Mermaid syntax')
        }
        
        const { svg } = await mermaid.render(`mermaid-${id}`, code)
        if (ref.current) {
          ref.current.innerHTML = svg
        }
      } catch (error) {
        console.error('Mermaid rendering error:', error)
        setError(error instanceof Error ? error.message : 'Unknown error')
        if (ref.current) {
          ref.current.innerHTML = `
            <div class="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
              <p class="text-red-700 dark:text-red-300 text-sm font-medium">
                Failed to render diagram
              </p>
              <p class="text-red-600 dark:text-red-400 text-xs mt-1">${error instanceof Error ? error.message : 'Unknown error'}</p>
              <details class="mt-2">
                <summary class="text-xs text-red-600 dark:text-red-400 cursor-pointer hover:text-red-800 dark:hover:text-red-200">
                  Show diagram source
                </summary>
                <pre class="mt-2 text-xs text-red-600 dark:text-red-400 overflow-x-auto p-2 bg-red-100 dark:bg-red-900/40 rounded">${code}</pre>
              </details>
            </div>
          `
        }
      } finally {
        setIsLoading(false)
      }
    }

    renderDiagram()
  }, [code, id])

  return (
    <div className="my-4 flex justify-center">
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
          Rendering diagram...
        </div>
      )}
      {error && (
        <div className="text-red-600 dark:text-red-400 text-sm font-medium">
          {"Error rendering diagram!"}
        </div>
      )}
      <div ref={ref} className="max-w-full overflow-x-auto" />
    </div>
  )
})

// Configuration for callout types
const CALLOUT_CONFIGS = {
  note: {
    icon: Info,
    className: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100',
    iconClassName: 'text-blue-600 dark:text-blue-400'
  },
  info: {
    icon: Info,
    className: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100',
    iconClassName: 'text-blue-600 dark:text-blue-400'
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-100',
    iconClassName: 'text-yellow-600 dark:text-yellow-400'
  },
  caution: {
    icon: AlertTriangle,
    className: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-100',
    iconClassName: 'text-yellow-600 dark:text-yellow-400'
  },
  danger: {
    icon: XCircle,
    className: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100',
    iconClassName: 'text-red-600 dark:text-red-400'
  },
  error: {
    icon: XCircle,
    className: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100',
    iconClassName: 'text-red-600 dark:text-red-400'
  },
  success: {
    icon: CheckCircle,
    className: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100',
    iconClassName: 'text-green-600 dark:text-green-400'
  },
  check: {
    icon: CheckCircle,
    className: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100',
    iconClassName: 'text-green-600 dark:text-green-400'
  },
  tip: {
    icon: Lightbulb,
    className: 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 text-purple-900 dark:text-purple-100',
    iconClassName: 'text-purple-600 dark:text-purple-400'
  }
} as const

// Default fallback config
const DEFAULT_CALLOUT_CONFIG = {
  icon: Info,
  className: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100',
  iconClassName: 'text-gray-600 dark:text-gray-400'
} as const

// Component for custom callouts/admonitions
const Callout = React.memo(function Callout({ type, children }: { type: string; children: React.ReactNode }) {
  const config = useMemo(() => {
    const normalizedType = type.toLowerCase() as CalloutType
    return CALLOUT_CONFIGS[normalizedType] || DEFAULT_CALLOUT_CONFIG
  }, [type])

  const IconComponent = config.icon

  return (
    <div className={`p-4 rounded-lg border-l-4 my-4 ${config.className}`}>
      <div className="flex items-start gap-3">
        <IconComponent className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.iconClassName}`} />
        <div className="flex-1 [&>:first-child]:mt-0 [&>:last-child]:mb-0">
          {children}
        </div>
      </div>
    </div>
  )
})

// Component for headings with anchor links
const Heading = React.memo(function Heading({ level, children, ...props }: { level: number; children: React.ReactNode; [key: string]: any }) {
  const text = typeof children === 'string' ? children : children?.toString() || ''
  const id = useMemo(() => 
    text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim(), 
    [text]
  )
  
  const handleAnchorClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      window.history.pushState(null, '', `#${id}`)
    }
  }, [id])

  const headingProps = useMemo(() => ({
    id,
    className: "group relative scroll-mt-4",
    ...props
  }), [id, props])

  const anchorLink = useMemo(() => (
    <a
      href={`#${id}`}
      onClick={handleAnchorClick}
      className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label={`Link to ${text}`}
    >
      <Hash className="h-4 w-4 text-gray-400" />
    </a>
  ), [id, handleAnchorClick, text])

  switch (level) {
    case 1:
      return <h1 {...headingProps}>{anchorLink}{children}</h1>
    case 2:
      return <h2 {...headingProps}>{anchorLink}{children}</h2>
    case 3:
      return <h3 {...headingProps}>{anchorLink}{children}</h3>
    case 4:
      return <h4 {...headingProps}>{anchorLink}{children}</h4>
    case 5:
      return <h5 {...headingProps}>{anchorLink}{children}</h5>
    case 6:
      return <h6 {...headingProps}>{anchorLink}{children}</h6>
    default:
      return <h2 {...headingProps}>{anchorLink}{children}</h2>
  }
})

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // Memoize the components object to prevent recreation on every render
  const components = useMemo<Components>(() => ({
    // Custom code block component with syntax highlighting
    code: ({ node, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : ''
      const code = String(children).replace(/\n$/, '')
      
      // Handle Mermaid diagrams
      if (language === 'mermaid') {
        const id = `mermaid-${hashString(code)}`
        return <MermaidDiagram code={code} id={id} />
      }
      
      if (language) {
        return (
          <CodeBlock
            language={language}
            code={code}
            showLineNumbers={code.split('\n').length > 1}
            key={`${language}-${code.length}-${hashString(code)}`}
          />
        )
      }
      
      // Inline code
      return (
        <code 
          className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono border border-gray-200 dark:border-gray-700" 
          {...props}
        >
          {children}
        </code>
      )
    },
    
    // Custom table component with copy/download functionality
    table: ({ children, ...props }) => (
      <TableComponent {...props}>
        {children}
      </TableComponent>
    ),
    
    // Custom pre component to prevent double-wrapping with code blocks
    pre: ({ children }) => <>{children}</>,
    
    // Custom headings with anchor links
    h1: ({ children, ...props }) => <Heading level={1} {...props}>{children}</Heading>,
    h2: ({ children, ...props }) => <Heading level={2} {...props}>{children}</Heading>,
    h3: ({ children, ...props }) => <Heading level={3} {...props}>{children}</Heading>,
    h4: ({ children, ...props }) => <Heading level={4} {...props}>{children}</Heading>,
    h5: ({ children, ...props }) => <Heading level={5} {...props}>{children}</Heading>,
    h6: ({ children, ...props }) => <Heading level={6} {...props}>{children}</Heading>,
    
    // Custom link styling with better accessibility
    a: ({ href, children, ...props }) => (
      <a 
        href={href} 
        target={href?.startsWith('http') ? '_blank' : '_self'}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-blue-600/30 dark:decoration-blue-400/30 hover:decoration-blue-600 dark:hover:decoration-blue-400 underline-offset-2 transition-colors"
        {...props}
      >
        {children}
      </a>
    ),
    
    // Enhanced blockquote styling with callout detection
    blockquote: ({ children, ...props }) => {
      // Check if this is a callout (GitHub-style admonitions)
      const firstChild = Array.isArray(children) ? children[0] : children
      if (firstChild && typeof firstChild === 'object' && 'props' in firstChild) {
        const firstPara = firstChild.props?.children
        if (Array.isArray(firstPara) && firstPara[0] && typeof firstPara[0] === 'string') {
          const text = firstPara[0].trim()
          const calloutMatch = text.match(/^\[!(NOTE|INFO|WARNING|CAUTION|DANGER|ERROR|SUCCESS|CHECK|TIP)\]/)
          if (calloutMatch) {
            const type = calloutMatch[1]
            // Remove the callout prefix from content
            const modifiedChildren = React.cloneElement(firstChild, {
              ...firstChild.props,
              children: {
                ...firstChild.props.children,
                0: text.replace(calloutMatch[0], '').trim()
              }
            })
            
            return (
              <Callout type={type}>
                {modifiedChildren}
                {Array.isArray(children) ? children.slice(1) : null}
              </Callout>
            )
          }
        }
      }
      
      // Regular blockquote
      return (
        <blockquote 
          className="border-l-4 border-gray-300 dark:border-gray-600 pl-6 my-6 italic text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/30 py-4 rounded-r-lg"
          {...props}
        >
          {children}
        </blockquote>
      )
    },
    
    // Enhanced list styling
    ul: ({ children, ...props }) => (
      <ul className="space-y-1 [&>li]:relative [&>li]:pl-6 [&>li]:before:content-['•'] [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:text-gray-400 [&>li]:before:font-bold" {...props}>
        {children}
      </ul>
    ),
    
    ol: ({ children, ...props }) => (
      <ol className="space-y-1 [&>li]:relative [&>li]:pl-6" {...props}>
        {children}
      </ol>
    ),
    
    // Enhanced paragraph spacing
    p: ({ children, ...props }) => (
      <p className="leading-relaxed mb-4 last:mb-0" {...props}>
        {children}
      </p>
    ),
    
    // Enhanced horizontal rule
    hr: ({ ...props }) => (
      <hr className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" {...props} />
    ),
    
    // Enhanced emphasis
    strong: ({ children, ...props }) => (
      <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props}>
        {children}
      </strong>
    ),
    
    em: ({ children, ...props }) => (
      <em className="italic text-gray-800 dark:text-gray-200" {...props}>
        {children}
      </em>
    ),
  }), [])

  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert prose-headings:scroll-mt-4 prose-code:text-sm prose-pre:p-0 prose-pre:bg-transparent ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
} 