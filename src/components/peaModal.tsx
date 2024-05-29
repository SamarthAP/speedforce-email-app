import { useEffect, useState, forwardRef, useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Dialog, DialogOverlay } from "./ui/dialog";
import { cn } from "../lib/utils";
import { useSelectedAccount } from "../contexts/SelectedAccountContext";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ChevronRightIcon } from "lucide-react";

const DialogPortal = DialogPrimitive.Portal;

const DialogContentNoIcon = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
  // eslint-disable-next-line react/prop-types
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay className="outline-none" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 flex flex-col w-full h-[80%] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        className
      )}
      {...props}
    >
      {children}
      {/* <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <Cross2Icon className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close> */}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContentNoIcon.displayName = DialogPrimitive.Content.displayName;

export default function PeaModal() {
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<PeaMessage[]>([]);

  const { selectedAccount } = useSelectedAccount();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && e.metaKey) {
        setIsOpen(!isOpen);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    // scroll to the bottom of the message container when new messages are added
    messageContainerRef.current?.scrollTo({
      top: messageContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <Dialog open={isOpen}>
      <DialogContentNoIcon>
        <div
          ref={messageContainerRef}
          className="h-full overflow-scroll border bg-background rounded-lg p-6 shadow-lg"
        >
          {messages.map((message, index) => (
            <PeaMessage key={index} {...message} />
          ))}
        </div>
        <div className="flex w-full items-center space-x-2 bg-background rounded-lg shadow-lg">
          <Input type="text" placeholder="Message" />
          <Button
            type="submit"
            className="px-2"
            onClick={(e) => {
              e.preventDefault();
              setMessages([
                ...messages,
                { role: "user", content: "Hello this is a test message" },
              ]);
            }}
          >
            <ChevronRightIcon className="h-5 w-5" />
          </Button>
        </div>
      </DialogContentNoIcon>
    </Dialog>
  );
}

interface PeaMessage {
  role: "user" | "system";
  content: string;
}

function PeaMessage({ role, content }: PeaMessage) {
  return <div className="">{content}</div>;
}
