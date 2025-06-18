import { useState, useRef, KeyboardEvent, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useConvexMutation, useConvexQuery, useConvexAction } from '@convex-dev/react-query'
import TextareaAutosize from 'react-textarea-autosize'
import { AttachmentTray } from './AttachmentTray'
import { ModelSelectorDropZone } from './ModelSelectorDropZone'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'

interface Attachment {
  id: string
  file: File
  name: string
  type: string
  preview?: string
  uploading?: boolean
  uploaded?: boolean
  attachmentId?: Id<"attachments">
  error?: string
}

interface MessageInputProps {
  threadId?: string
}

export function MessageInput({ threadId }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRefining, setIsRefining] = useState(false)
  const [reasoningEffort, setReasoningEffort] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const navigate = useNavigate()
  const addMessagesToThread = useConvexMutation(api.messages.mutations.addMessagesToThread)
  const generateUploadUrl = useConvexMutation(api.attachments.mutations.generateUploadUrl)
  const uploadFile = useConvexMutation(api.attachments.mutations.uploadFile)
  const refineUserPrompt = useConvexAction(api.ai.chat.refineUserPrompt)
  
  // Fetch user configuration to get preferred model and settings
  const userConfig = useConvexQuery(api.account.queries.getUserConfiguration, {})
  
  // Initialize search enabled state with user's default preference
  const [searchEnabled, setSearchEnabled] = useState(
    userConfig?.currentModelParameters?.includeSearch || false
  )

  // Update searchEnabled when userConfig changes
  useEffect(() => {
    if (userConfig?.currentModelParameters?.includeSearch !== undefined) {
      setSearchEnabled(userConfig.currentModelParameters.includeSearch)
    }
  }, [userConfig?.currentModelParameters?.includeSearch])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const validateFileType = (file: File): boolean => {
    const allowedTypes = [
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png', 
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // PDFs
      'application/pdf',
    ]
    return allowedTypes.includes(file.type)
  }

  const getAttachmentType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType === 'application/pdf') return 'file'
    return 'file'
  }

  const uploadFileToStorage = async (file: File): Promise<Id<"attachments">> => {
    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl({})
      
      // Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      
      if (!result.ok) {
        throw new Error('Failed to upload file')
      }
      
      const { storageId } = await result.json()
      
      // Create attachment record
      const attachmentResult = await uploadFile({
        storageId,
        fileName: file.name,
        mimeType: file.type,
        attachmentType: getAttachmentType(file.type),
        fileSize: file.size,
      })
      
      return attachmentResult.attachmentId
    } catch (error) {
      console.error('File upload failed:', error)
      throw error
    }
  }

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return
    
    // Check if any attachments are still uploading
    const uploadingAttachments = attachments.filter(att => att.uploading)
    if (uploadingAttachments.length > 0) {
      console.warn('Please wait for all files to finish uploading')
      return
    }

    // Check if any attachments failed to upload
    const failedAttachments = attachments.filter(att => att.error)
    if (failedAttachments.length > 0) {
      console.warn('Some files failed to upload. Please remove them and try again.')
      return
    }
    
    setIsGenerating(true)
    
    try {
      // Determine if this is a new thread
      const isNewThread = !threadId
      const targetThreadId = threadId || crypto.randomUUID()
      
      // Get attachment IDs from uploaded attachments
      const attachmentIds = attachments
        .filter(att => att.uploaded && att.attachmentId)
        .map(att => att.attachmentId!)

      // Get user's preferred model from configuration
      const selectedModel = userConfig?.currentlySelectedModel || 'gpt-4o-mini'

      // Prepare the user message
      const userMessage = {
        content: message.trim(),
        model: selectedModel,
        attachmentIds,
        modelParams: {
          temperature: userConfig?.currentModelParameters?.temperature || 0.7,
          includeSearch: searchEnabled,
          reasoningEffort: reasoningEffort ? ('medium' as const) : undefined,
        },
      }

      // Call the mutation
      await addMessagesToThread({
        threadId: targetThreadId,
        userMessage,
        newThread: isNewThread,
      })

      // Clear the input
      setMessage('')
      setAttachments([])

      // Navigate to the new thread if this was a new thread
      if (isNewThread) {
        navigate({ to: '/chat/$threadId', params: { threadId: targetThreadId } })
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // TODO: Show error toast
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStop = () => {
    setIsGenerating(false)
    // TODO: Implement stop logic
    console.log('Stopping generation')
  }

  const handleRefinePrompt = async () => {
    if (!message.trim()) return
    
    setIsRefining(true)
    try {
      const result = await refineUserPrompt({ 
        prompt: message.trim(),
        threadId: threadId, // Pass the current thread ID for context
      })
      if (result.success) {
        setMessage(result.refinedPrompt)
      }
    } catch (error) {
      console.error('Failed to refine prompt:', error)
      // TODO: Show error toast
    } finally {
      setIsRefining(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    for (const file of files) {
      // Validate file type
      if (!validateFileType(file)) {
        console.error(`File type ${file.type} not allowed. Only images and PDFs are supported.`)
        continue
      }

      // Validate file size (10MB limit)
      const maxFileSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxFileSize) {
        console.error(`File ${file.name} is too large. Maximum size is 10MB.`)
        continue
      }

      const attachment: Attachment = {
        id: Date.now().toString() + Math.random(),
        file,
        name: file.name,
        type: file.type,
        uploading: true,
      }

      // Add to attachments immediately to show upload progress
      setAttachments(prev => [...prev, attachment])

      try {
        // Create preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (e) => {
            setAttachments(prev => 
              prev.map(att => 
                att.id === attachment.id 
                  ? { ...att, preview: e.target?.result as string }
                  : att
              )
            )
          }
          reader.readAsDataURL(file)
        }

        // Upload file in background
        const attachmentId = await uploadFileToStorage(file)
        
        // Mark as uploaded
        setAttachments(prev => 
          prev.map(att => 
            att.id === attachment.id 
              ? { ...att, uploading: false, uploaded: true, attachmentId }
              : att
          )
        )
      } catch (error) {
        // Mark as failed
        setAttachments(prev => 
          prev.map(att => 
            att.id === attachment.id 
              ? { ...att, uploading: false, error: 'Upload failed' }
              : att
          )
        )
      }
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id))
  }

  const canSend = (message.trim() || attachments.length > 0) && !isGenerating

  return (
    <div className="max-w-3xl mx-auto">
      <div className="border border-border dark:border-border rounded-xl shadow-sm bg-background dark:bg-background focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        {/* Attachment Tray */}
        {attachments.length > 0 && (
          <AttachmentTray 
            attachments={attachments} 
            onRemove={removeAttachment} 
          />
        )}

        {/* Text Input */}
        <div className="px-4 py-3">
          <TextareaAutosize
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="w-full resize-none border-0 bg-transparent text-foreground dark:text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
            minRows={1}
            maxRows={8}
          />
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border dark:border-border">
          <div className="flex items-center space-x-2">
            {/* Model Selector Drop Zone */}
            <ModelSelectorDropZone
              location="input"
              className="relative"
            />
            
            {/* Contextual Toggles */}
            <div className="flex items-center space-x-1">
              {/* Search Toggle */}
              <button
                onClick={() => setSearchEnabled(!searchEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  searchEnabled
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-muted'
                }`}
                title="Web Search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Reasoning Effort Toggle */}
              <button
                onClick={() => setReasoningEffort(!reasoningEffort)}
                className={`p-2 rounded-lg transition-colors ${
                  reasoningEffort
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-muted'
                }`}
                title="Reasoning Effort"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </button>

              {/* Attach File Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-muted rounded-lg transition-colors"
                title="Attach File (Images and PDFs only)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Refine Prompt Button */}
            <button
              onClick={handleRefinePrompt}
              disabled={!message.trim() || isRefining || isGenerating}
              className={`p-2 rounded-lg transition-all ${
                isRefining
                  ? 'text-purple-400 cursor-not-allowed shadow-lg shadow-purple-500/50 animate-pulse'
                  : message.trim() && !isGenerating
                  ? 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                  : 'text-muted-foreground cursor-not-allowed'
              }`}
              title="Refine Prompt"
            >
              {isRefining ? (
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <span className="text-base">✨</span>
              )}
            </button>

            {/* Send/Stop Button */}
            <button
              onClick={isGenerating ? handleStop : handleSend}
              disabled={!canSend && !isGenerating}
              className={`p-2 rounded-full transition-all ${
                isGenerating
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : canSend
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
              title={isGenerating ? 'Stop Generation' : 'Send Message'}
            >
              {isGenerating ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,.pdf"
      />
    </div>
  )
} 