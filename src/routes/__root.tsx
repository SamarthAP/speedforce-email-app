// resource: https://tanstack.com/router/latest/docs/framework/react/guide/file-based-routing

import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import { SessionContextInterface } from "../contexts/SessionContext";
import { cn } from "../lib/utils";
import { TitleBar } from "../components/titlebar";

interface MyRouterContext {
  auth: SessionContextInterface;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
  // beforeLoad: ({ context }) => {
  //   console.log("root beforeLoad", context);
  // },
});

function RootComponent() {
  return (
    <div
      className={cn(
        "fixed inset-0 overflow-hidden custom-select-none grid h-screen"
      )}
      style={{
        gridTemplateRows: "30px auto",
      }}
    >
      <TitleBar />
      <Outlet />
      {/* <TanStackRouterDevtools /> */}
    </div>
  );
}
