import { useSessionContext } from "@supabase/auth-helpers-react";
import { Navigate } from "react-router-dom";

export default function AuthChecker() {
  const { isLoading, session, error } = useSessionContext();

  if (error) {
    return <div>{error.message}</div>;
  }

  if (!session && !isLoading) {
    return <Navigate to="/login" replace={true} />;
  }

  if (!session && isLoading) {
    return <div>Loading...</div>;
  }

  return <Navigate to="/home" replace={true} />;
}
