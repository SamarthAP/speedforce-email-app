import { createFileRoute } from "@tanstack/react-router";
import LoginForm from "../components/loginForm";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
});

function LoginComponent() {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col overflow-hidden",
        "items-center justify-center"
      )}
    >
      <LoginForm />
    </div>
  );
}
