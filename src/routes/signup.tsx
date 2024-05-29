import { createFileRoute } from "@tanstack/react-router";
import SignupForm from "../components/signupForm";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/signup")({
  component: SignupComponent,
});

function SignupComponent() {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col overflow-hidden",
        "items-center justify-center"
      )}
    >
      <SignupForm />
    </div>
  );
}
