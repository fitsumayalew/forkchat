import { NavUser } from "./NavUser";
import { 
  Sidebar, 
  SidebarContent as UISidebarContent, 
  SidebarFooter, 
  SidebarRail 
} from "../ui/sidebar";
import { SidebarContent } from "./SidebarContent";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeThreadId?: string;
}

export function AppSidebar({ activeThreadId, ...props }: AppSidebarProps) {
  const { data } = useQuery(convexQuery(api.auth.getCurrentUser, {}));
  
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <UISidebarContent className="p-0">
        <SidebarContent activeThreadId={activeThreadId} />
      </UISidebarContent>
      <SidebarFooter>
        <NavUser user={{
          name: data?.name ?? "",
          email: data?.email ?? "",
          avatar: data?.image ?? "",
        }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
  