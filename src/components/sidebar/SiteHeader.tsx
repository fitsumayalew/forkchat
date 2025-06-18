import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useTheme } from "@/components/ThemeProvider"
import { ShareDialog } from "@/components/chat/ShareDialog"
import { SummaryDialog } from "@/components/chat/SummaryDialog"
import { ModelSelectorDropZone } from "@/components/chat/ModelSelectorDropZone"
import { Share2, FileText } from "lucide-react"
import * as React from "react"

interface SiteHeaderProps {
  threadId?: string
}

function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 7.07-1.41-1.41M6.34 6.34 4.93 4.93m12.02 0-1.41 1.41M6.34 17.66l-1.41 1.41"/></svg>
  );
}

function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>
  );
}

export function SiteHeader({ threadId }: SiteHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [summaryDialogOpen, setSummaryDialogOpen] = React.useState(false);
  
  // Determine the current theme (system, dark, or light)
  const [resolvedTheme, setResolvedTheme] = React.useState<"dark" | "light">("light");
  React.useEffect(() => {
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      setResolvedTheme(systemTheme);
    } else {
      setResolvedTheme(theme as "dark" | "light");
    }
  }, [theme]);
  const isDark = resolvedTheme === "dark";
  
  return (
    <>
              <header className="sticky top-0 z-50 shrink-0 flex h-(--header-height) items-center justify-between transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) bg-background/80 dark:bg-background/80 backdrop-blur-md border-b border-border/40 dark:border-border/40 shadow-sm">
          <ModelSelectorDropZone
            location="header"
            className="flex items-center gap-3 px-4 lg:px-6 relative"
          >
            <SidebarTrigger className="hover:bg-muted dark:hover:bg-muted" />
          </ModelSelectorDropZone>
        
        <div className="flex items-center gap-2 px-4 lg:px-6">
          {/* Summary button - only show when we have a threadId */}
          {threadId && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Summarize conversation"
              onClick={() => setSummaryDialogOpen(true)}
              className="hover:bg-muted dark:hover:bg-muted"
            >
              <FileText className="size-5" />
            </Button>
          )}
          
          {/* Share button - only show when we have a threadId */}
          {threadId && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Share conversation"
              onClick={() => setShareDialogOpen(true)}
              className="hover:bg-muted dark:hover:bg-muted"
            >
              <Share2 className="size-5" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="hover:bg-muted dark:hover:bg-muted"
          >
            {isDark ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
          </Button>
        </div>
      </header>

      {/* Summary Dialog */}
      {threadId && (
        <SummaryDialog
          isOpen={summaryDialogOpen}
          onOpenChange={setSummaryDialogOpen}
          threadId={threadId}
        />
      )}

      {/* Share Dialog */}
      {threadId && (
        <ShareDialog
          isOpen={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          threadId={threadId}
        />
      )}
    </>
  )
}
