import { NavUser } from "./NavUser";
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarRail } from "../ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const {data} = useQuery(convexQuery( api.auth.getCurrentUser,{}));
    return (
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl  font-bold">ForkChat</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
           
        </SidebarContent>
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
  