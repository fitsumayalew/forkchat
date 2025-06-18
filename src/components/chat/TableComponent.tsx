import React, { useState, useRef } from 'react'
import { Button } from '../ui/button'
import { Copy, Download, Check } from 'lucide-react'

interface TableComponentProps {
  children: React.ReactNode
  className?: string
}

export function TableComponent({ children, className = '' }: TableComponentProps) {
  const [copied, setCopied] = useState(false)
  const tableWrapperRef = useRef<HTMLDivElement>(null)

  // Extract table data for copy/download functionality
  const extractTableData = () => {
    const table = tableWrapperRef.current?.querySelector('table')
    if (!table) return ''

    const rows = Array.from(table.querySelectorAll('tr'))
    return rows
      .map((row) => {
        const cells = Array.from(row.querySelectorAll('td, th'))
        return cells.map((cell) => cell.textContent?.trim() || '').join('\t')
      })
      .join('\n')
  }

  const handleCopy = async () => {
    try {
      const tableData = extractTableData()
      await navigator.clipboard.writeText(tableData)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy table:', err)
    }
  }

  const handleDownload = () => {
    try {
      const tableData = extractTableData()
      const blob = new Blob([tableData], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'table-data.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download table:', err)
    }
  }

  return (
    <div className={`relative group my-4 ${className}`} ref={tableWrapperRef}>
      {/* Table controls */}
      <div className="flex items-center justify-end gap-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 px-2 text-xs">
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" /> Copy
            </>
          )}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDownload} className="h-6 px-2 text-xs">
          <Download className="h-3 w-3 mr-1" /> CSV
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          {children}
        </table>
      </div>
    </div>
  )
} 