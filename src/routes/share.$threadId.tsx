import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Button } from '../components/ui/button'
import { MarkdownContent } from '../components/chat/MarkdownContent'
import { useState } from 'react'
import {   Plus, User } from 'lucide-react'

export const Route = createFileRoute('/share/$threadId')({
  component: ShareRouteComponent,
})

function ShareRouteComponent() {
  const { threadId } = Route.useParams()
  const router = useRouter()
  const [copying, setCopying] = useState(false)
  
  const thread = useQuery(api.threads.queries.getPublicThread, { threadId })
  const messages = useQuery(api.messages.queries.getPublicByThreadId, { threadId })
  const currentUser = useQuery(api.auth.getCurrentUser, {})
  const copySharedThread = useMutation(api.threads.mutations.copySharedThread)

  // Helper function to extract text content from messages
  const getMessageText = (message: any) => {
    if (message.role === 'user') {
      return message.content || ''
    } else {
      // Assistant messages have parts array
      return message.parts
        ?.filter((part: any) => part.type === 'text')
        ?.map((part: any) => part.text)
        ?.join('\n\n') || ''
    }
  }

  const handleCopyToMyChats = async () => {
    if (!currentUser) return
    
    setCopying(true)
    try {
      const result = await copySharedThread({ 
        sharedThreadId: threadId 
      })
      
      if (result.success) {
        // Redirect to the copied chat
        router.navigate({ to: `/chat/${result.newThreadId}` })
      }
    } catch (error) {
      console.error('Failed to copy chat:', error)
    } finally {
      setCopying(false)
    }
  }

  if (thread === undefined || messages === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading shared chat...</p>
        </div>
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Chat Not Found</h1>
          <p className="text-muted-foreground">This chat is either not shared or doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header with sharer info and copy button */}
        <div className="bg-card border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage 
                  src={thread.sharer?.image || ""} 
                  alt={thread.sharer?.name || "Anonymous"} 
                />
                <AvatarFallback>
                  {thread.sharer?.name ? 
                    thread.sharer.name.split(" ").reduce((acc: string, curr: string) => acc + curr.charAt(0), "").slice(0, 2) 
                    : <User className="h-6 w-6" />
                  }
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{thread.title}</h1>
                <p className="text-muted-foreground">
                  Shared by {thread.sharer?.name || "Anonymous"}
                </p>
              </div>
            </div>
            
            {currentUser && (
              <Button 
                onClick={handleCopyToMyChats}
                disabled={copying}
                className="flex items-center gap-2"
              >
                {copying ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {copying ? "Copying..." : "Add to My Chats"}
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-6">
          {messages && messages.map((message) => (
            <div key={message._id} className="w-full">
              <MarkdownContent 
                message={{
                  messageId: message._id,
                  role: message.role as 'user' | 'assistant',
                  parts: message.role === 'user' 
                    ? [{ type: 'text', text: getMessageText(message) }]
                    : (message.parts || [])
                        .filter((part: any) => part.type === 'text' || part.type === 'reasoning')
                        .map((part: any) => ({
                          type: part.type,
                          text: part.type === 'text' ? part.text : part.reasoning
                        })),
                  status: 'done',
                  created_at: message._creationTime
                }}
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>This is a shared conversation. {currentUser ? "You can add it to your chats to continue the conversation." : "Sign in to add this to your chats."}</p>
        </div>
      </div>
    </div>
  )
} 