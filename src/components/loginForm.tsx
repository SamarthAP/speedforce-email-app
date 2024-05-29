import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState } from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import supabase from "../lib/supabase";
import { useSession } from "../contexts/SessionContext";

const emailSchema = z.string().email();
const passwordSchema = z
  .string()
  .min(6)
  .regex(/(?=.*[0-9])(?=.*[a-zA-Z])/);

export default function LoginForm() {
  // TODO: finish login
  const navigate = useNavigate();
  const auth = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState("");

  const handleSignin = async () => {
    setLoading(true);

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      setError((err as Error).message || "An error occurred.");
      toast(error);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      void navigate({ to: "/dashboard" });
    } catch (e) {
      setError((e as Error).message || "An error occurred.");
      toast(error);
    }

    setLoading(false);
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your email below to login to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setEmail(e.target.value);
            }}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPassword(e.target.value);
            }}
            required
          />
        </div>
        <Button
          disabled={loading}
          onClick={() => void handleSignin()}
          className="w-full"
        >
          Sign in
        </Button>
      </CardContent>
      <CardFooter>
        <div className="w-full text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link to="/signup" from="/login" className="underline">
            Sign Up
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
