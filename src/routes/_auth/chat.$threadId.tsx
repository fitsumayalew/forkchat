import { createFileRoute } from '@tanstack/react-router'
import { SiteHeader } from '@/components/sidebar/SiteHeader'
import { AppSidebar } from '@/components/sidebar/AppSidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { ChatInterface } from '@/components/chat/ChatInterface'

export const Route = createFileRoute('/_auth/chat/$threadId')({
  component: ChatPage,
})

function ChatPage() {
  const { threadId } = Route.useParams()

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant='inset' />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <SiteHeader />
        <ChatInterface threadId={threadId} />
      </SidebarInset>
    </SidebarProvider>
  )
} 