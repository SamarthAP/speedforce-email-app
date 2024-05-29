import { Navigate, Outlet, createFileRoute } from "@tanstack/react-router";
import { useSession } from "../contexts/SessionContext";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedRoute,
});

function AuthenticatedRoute() {
  const auth = useSession();
  if (!auth.isAuthenticated) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
}
