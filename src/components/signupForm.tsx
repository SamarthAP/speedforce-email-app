import supabase from "../lib/supabase";
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
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import toast from "react-hot-toast";
import { z } from "zod";

const emailSchema = z.string().email();
const passwordSchema = z
  .string()
  .min(6)
  .regex(/(?=.*[0-9])(?=.*[a-zA-Z])/);

export default function SignupForm() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // TODO: add error handling

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState("");

  const handleSignup = async () => {
    // validate email and password with zod
    // firebase password requirement is 6 characters number and letter

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
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      } else {
        toast(
          "Account created, please check your email for a verification link and then log in",
          {
            duration: 15000,
          }
        );
      }

      setPassword("");
    } catch (e) {
      setError((e as Error).message || "An error occurred.");
      toast(error);
    }

    setLoading(false);
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Signup</CardTitle>
        <CardDescription>
          Enter your information to create an account.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setEmail(e.target.value);
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPassword(e.target.value);
            }}
          />
        </div>
        <Button
          className="w-full"
          disabled={loading}
          onClick={() => void handleSignup()}
        >
          Create account
        </Button>
      </CardContent>
      <CardFooter>
        <div className="w-full text-center text-sm">
          Already have an account?{" "}
          <Link to="/login" from="/signup" className="underline">
            Log In
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
