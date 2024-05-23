import { Outlet, createFileRoute } from "@tanstack/react-router";
import { HomeIcon, InboxIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { TooltipProvider } from "../components/ui/tooltip";
import { Nav } from "../components/nav";
import { useEffect, useState } from "react";
import { exchangeCodeForToken, getAuthURL } from "../api/auth";
import {
  SelectedAccount,
  getAccounts,
  getSelectedAccount,
} from "../lib/localstorage";
import { SelectedAccountContext } from "../contexts/SelectedAccountContext";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardRoute,
});

function DashboardRoute() {
  const [selectedAccount, setSelectedAccount] =
    useState<SelectedAccount | null>(() => {
      const selectedAccount = getSelectedAccount();

      if (!selectedAccount) {
        const accounts = getAccounts();

        if (accounts.length > 0) {
          const newSelectedAccount = accounts[0];
          if (newSelectedAccount.email) {
            localStorage.setItem(
              "selectedAccount",
              JSON.stringify(newSelectedAccount)
            );
            return newSelectedAccount;
          }
        }
        return null;
      }

      return selectedAccount;
    });

  /**
   * Opens a URL in the default browser
   * @param url string representing the URL
   */
  function openOAuthWindow(url: string) {
    window.electron.ipcRenderer.sendMessage("open-link-in-browser", url);
  }

  async function providerSignIn(provider: "google" | "outlook") {
    const { data, error } = await getAuthURL(provider);

    if (error || !data) {
      console.error(error);
      return;
    }
    openOAuthWindow(data.url);
  }

  useEffect(() => {
    console.log("running effect");
    async function handler(args: string) {
      console.log("running handler");
      try {
        const url = new URL(args);
        const code = url.searchParams.get("code");

        let provider: "google" | "outlook";
        if (url.pathname === "//auth/google/callback") {
          provider = "google";
        } else if (url.pathname === "//auth/outlook/callback") {
          provider = "outlook";
        } else {
          // TODO: handle error
          return;
        }

        if (code) {
          if (code === "error") {
            // todo
          } else {
            const { data, error } = await exchangeCodeForToken(provider, code);

            if (error || !data) {
              // TODO: do something
              return;
            }

            const accounts = getAccounts();
            const newAccount: SelectedAccount = {
              email: data.email,
              provider: provider,
              accessToken: data.accessToken,
              expiresAt: data.expiresAt,
            };

            const emailExists = accounts.find(
              (account) => account.email === data.email
            );

            if (emailExists) {
              const newAccounts = accounts.map((account) => {
                if (account.email === data.email) {
                  return {
                    ...account,
                    provider: data.provider,
                    accessToken: data.accessToken,
                    expiresAt: data.expiresAt,
                  };
                }

                return account;
              });

              localStorage.setItem("accounts", JSON.stringify(newAccounts));
              localStorage.setItem(
                "selectedAccount",
                JSON.stringify(newAccount)
              );
              setSelectedAccount(newAccount);
            } else {
              const newAccounts = [...accounts, newAccount];

              localStorage.setItem("accounts", JSON.stringify(newAccounts));
              localStorage.setItem(
                "selectedAccount",
                JSON.stringify(newAccount)
              );
              setSelectedAccount(newAccount);
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    return window.electron.ipcRenderer.onOpenUrl(handler);
  }, [setSelectedAccount]);

  return (
    <div className="relative h-full w-full overflow-hidden px-2 pb-2">
      <SelectedAccountContext.Provider
        value={{ selectedAccount, setSelectedAccount }}
      >
        {selectedAccount ? (
          <TooltipProvider delayDuration={0}>
            <div className="flex h-full overflow-hidden">
              <Nav
                links={[
                  {
                    title: "Dashboard",
                    icon: HomeIcon,
                    to: "/dashboard",
                    variant: "ghost",
                  },
                  {
                    title: "Inbox",
                    icon: InboxIcon,
                    to: "/dashboard/inbox",
                    variant: "ghost",
                  },
                ]}
              />
              <div className="w-full h-full">
                <Outlet />
              </div>
            </div>
          </TooltipProvider>
        ) : (
          <div className="flex flex-col h-full w-full justify-center items-center">
            <h1 className="text-2xl font-bold mb-2">Add an account</h1>
            <div className="flex flex-col gap-y-2">
              <Button
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  providerSignIn("google");
                }}
              >
                Google
              </Button>
              <Button size="sm">Microsoft</Button>
            </div>
          </div>
        )}
      </SelectedAccountContext.Provider>
    </div>
  );
}
