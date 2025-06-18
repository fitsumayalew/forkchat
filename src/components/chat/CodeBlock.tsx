import { useState, useEffect, useMemo } from 'react'
import { Button } from '../ui/button'
import { Copy, Check, Hash, Download } from 'lucide-react'
import { codeToHtml, bundledLanguages } from 'shiki'

interface CodeBlockProps {
  language: string
  code: string
  showLineNumbers?: boolean
  isDiff?: boolean
  fileName?: string
  theme?: 'light' | 'dark' | 'auto'
}

// Cache for highlighted code to improve performance
const highlightCache = new Map<string, string>()

// Helper to detect if code is a diff
const isDiffContent = (code: string, language: string): boolean => {
  if (language === 'diff') return true
  const lines = code.split('\n')
  const diffLines = lines.filter(line => 
    line.startsWith('+') || line.startsWith('-') || line.startsWith('@@')
  )
  return diffLines.length > 0 && diffLines.length > lines.length * 0.3
}

// Helper to normalize language names
const normalizeLanguage = (lang: string): string => {
  const langMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'sh': 'bash',
    'yml': 'yaml',
    'md': 'markdown',
    'rb': 'ruby',
    'kt': 'kotlin',
    'cs': 'csharp',
    'cpp': 'cpp',
    'cc': 'cpp',
    'c++': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
  }
  
  const normalized = langMap[lang.toLowerCase()] || lang.toLowerCase()
  
  // Check if language is supported by Shiki
  if (Object.keys(bundledLanguages).includes(normalized)) {
    return normalized
  }
  
  // Fallback to text if language not supported
  return 'text'
}

export function CodeBlock({ 
  language, 
  code, 
  showLineNumbers = true, 
  isDiff: forceDiff = false,
  fileName,
  theme = 'auto'
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [highlightedCode, setHighlightedCode] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Detect system theme preference
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('dark')
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }
    
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Determine the actual theme to use
  const actualTheme = useMemo(() => {
    if (theme === 'auto') {
      return systemTheme === 'dark' ? 'github-dark' : 'github-light'
    }
    return theme === 'dark' ? 'github-dark' : 'github-light'
  }, [theme, systemTheme])

  // Normalize language and detect if it's a diff
  const normalizedLanguage = useMemo(() => normalizeLanguage(language), [language])
  const isDiffCode = useMemo(() => forceDiff || isDiffContent(code, language), [code, language, forceDiff])
  const effectiveLanguage = isDiffCode ? 'diff' : normalizedLanguage

  // Create cache key
  const cacheKey = useMemo(() => {
    return `${effectiveLanguage}:${actualTheme}:${showLineNumbers}:${code.slice(0, 100)}`
  }, [effectiveLanguage, actualTheme, showLineNumbers, code])

  useEffect(() => {
    const highlightCode = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Check cache first
        if (highlightCache.has(cacheKey)) {
          setHighlightedCode(highlightCache.get(cacheKey)!)
          setLoading(false)
          return
        }

        const html = await codeToHtml(code, {
          lang: effectiveLanguage,
          theme: actualTheme,
          transformers: [
            {
              name: 'add-line-numbers',
              pre(node) {
                if (showLineNumbers) {
                  this.addClassToHast(node, 'line-numbers')
                }
              },
              code(node) {
                if (showLineNumbers) {
                  const lines = code.split('\n')
                  const lineCount = lines.length
                  const maxDigits = lineCount.toString().length
                  
                  // Add CSS custom property for max digits
                  node.properties.style = `--line-number-width: ${maxDigits + 1}ch;`
                }
              },
              line(node, line) {
                if (showLineNumbers) {
                  node.children.unshift({
                    type: 'element',
                    tagName: 'span',
                    properties: {
                      class: 'line-number',
                      'data-line': line
                    },
                    children: [{ type: 'text', value: line.toString().padStart(2, ' ') }]
                  })
                }
              }
            }
          ]
        })
        
        // Cache the result
        highlightCache.set(cacheKey, html)
        setHighlightedCode(html)
      } catch (error) {
        console.error('Failed to highlight code:', error)
        setError('Failed to highlight code')
        
        // Enhanced fallback with better styling
        const escapedCode = code
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
        
        const fallbackHtml = `
          <pre style="margin: 0; padding: 1rem; background: ${actualTheme === 'github-dark' ? '#0d1117' : '#f6f8fa'}; color: ${actualTheme === 'github-dark' ? '#e6edf3' : '#24292f'}; border-radius: 0.375rem; overflow-x: auto;"><code style="font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 0.875rem; line-height: 1.5;">${escapedCode}</code></pre>
        `
        setHighlightedCode(fallbackHtml)
      } finally {
        setLoading(false)
      }
    }

    highlightCode()
  }, [code, effectiveLanguage, actualTheme, showLineNumbers, cacheKey])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName || `code.${effectiveLanguage === 'diff' ? 'diff' : effectiveLanguage}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const lineCount = code.split('\n').length

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header with language, file name, and actions */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-4 py-2 text-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium">
            {isDiffCode ? 'diff' : language}
          </span>
          {fileName && (
            <>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600 dark:text-gray-300 truncate max-w-xs">
                {fileName}
              </span>
            </>
          )}
          {lineCount > 1 && (
            <>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {lineCount} lines
              </span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {error && (
            <span className="text-red-500 text-xs mr-2">
              Fallback mode
            </span>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-6 px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Download code"
          >
            <Download className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
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
        </div>
      </div>
      
      {/* Code content */}
      <div className="bg-white dark:bg-gray-900">
        {loading ? (
          <div className="p-4 text-gray-400 text-sm flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
            Highlighting syntax...
          </div>
        ) : (
          <div 
            className={`shiki-code-block overflow-x-auto ${showLineNumbers ? 'line-numbers-enabled' : ''}`}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        )}
      </div>
      
      {/* Inject custom styles for this component */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .shiki-code-block.line-numbers-enabled .line-number {
            display: inline-block;
            width: var(--line-number-width, 3ch);
            margin-right: 1rem;
            text-align: right;
            opacity: 0.5;
            user-select: none;
            border-right: 1px solid rgba(128, 128, 128, 0.2);
            padding-right: 0.5rem;
          }
          
          .shiki-code-block pre {
            margin: 0;
            padding: 1rem;
            background: transparent !important;
          }
          
          .shiki-code-block code {
            background: transparent !important;
          }
          
          .shiki-code-block .line[data-line*="+"] {
            background-color: rgba(63, 185, 80, 0.1);
          }
          
          .shiki-code-block .line[data-line*="-"] {
            background-color: rgba(248, 81, 73, 0.1);
          }
        `
      }} />
    </div>
  )
} 