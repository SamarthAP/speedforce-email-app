import { createFileRoute, Link, Navigate } from "@tanstack/react-router";

import { useSession } from "../contexts/SessionContext";
import { cn } from "../lib/utils";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import LoginForm from "../components/loginForm";
import SignupForm from "../components/signupForm";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/")({
  component: IndexComponent,
});

function IndexComponent() {
  const auth = useSession();

  if (!auth.isAuthenticated) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col overflow-hidden",
          "items-center justify-center"
        )}
      >
        <h1 className="text-4xl font-extrabold tracking-wide text-primary mb-4">
          Speedforce
        </h1>

        <div className="grid gap-2">
          <Link to="/login" from="/">
            <Button className="w-48">Log In</Button>
          </Link>
          <Link to="/signup" from="/signup">
            <Button variant={"outline"} className="w-48">
              Sign Up
            </Button>
          </Link>
        </div>

        {/* <Tabs
          defaultValue="login"
          className="w-[400px] flex flex-col items-center"
        >
          <TabsList>
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <LoginForm />
          </TabsContent>
          <TabsContent value="signup">
            <SignupForm />
          </TabsContent>
        </Tabs> */}
      </div>
    );
  }

  // if there is a redirect? param in the URL, redirect to that URL
  if (location.search.includes("redirect")) {
    const searchParams = new URLSearchParams(location.search);
    const redirect = searchParams.get("redirect");

    if (redirect) {
      return <Navigate to={redirect} />;
    }
  }

  return <Navigate to="/dashboard" />;
}
