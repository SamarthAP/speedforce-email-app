import { LucideIcon, SunMoonIcon } from "lucide-react";

import { cn } from "../lib/utils";

import { Button, buttonVariants } from "../components/ui/button";
import { Link } from "@tanstack/react-router";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { useTheme } from "../contexts/ThemeProvider";

interface NavProps {
  links: {
    title: string;
    label?: string;
    icon: LucideIcon;
    to: string;
    variant: "default" | "ghost";
  }[];
}

export function Nav({ links }: NavProps) {
  const { theme, setTheme } = useTheme();
  return (
    <nav className="flex flex-col gap-y-2 px-2">
      {links.map((link, index) => (
        <Tooltip key={index} delayDuration={0}>
          <TooltipTrigger asChild>
            <Link
              key={index}
              to={link.to}
              className={cn(
                buttonVariants({ variant: link.variant, size: "icon" }),
                "h-8 w-8",
                "justify-center"
              )}
            >
              <link.icon className="h-4 w-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="flex items-center gap-4 text-xs"
          >
            {link.title}
            {link.label && (
              <span className="ml-auto text-muted-foreground">
                {link.label}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      ))}
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", "justify-center")}
            onClick={() => {
              setTheme(theme === "dark" ? "light" : "dark");
            }}
          >
            <SunMoonIcon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="flex items-center gap-4 text-xs"
        >
          Change Theme
        </TooltipContent>
      </Tooltip>
    </nav>
  );
}
