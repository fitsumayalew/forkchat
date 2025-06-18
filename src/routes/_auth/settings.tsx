import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from '@/components/sidebar/SiteHeader'
import { AppSidebar } from '@/components/sidebar/AppSidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Settings } from "../../components/settings/Settings";

export const Route = createFileRoute("/_auth/settings")({
  component: SettingsPage,
});

function SettingsPage() {
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
        <div className="flex-1 overflow-hidden">
          <Settings />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 