import { createRootRoute, Outlet } from "@tanstack/react-router";
// import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";


export const Route = createRootRoute({
  component: () =>(
    <>
    <Outlet />
    <Toaster />
    {/* <TanStackRouterDevtools /> */}
    {/* <ReactQueryDevtools /> */}
    </>
  ),
});
