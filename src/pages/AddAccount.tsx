import { useEffect, useRef, useState } from "react";
import { exchangeCodeForToken, getAuthURL } from "../api/auth";
import GoogleLogo from "../assets/googleLogo.svg";
import MicrosoftLogo from "../assets/microsoftLogo.svg";

export default function AddAccount() {
  const [clientId, setClientId] = useState("");
  const renderCounter = useRef(0);
  renderCounter.current = renderCounter.current + 1;

  useEffect(() => {
    window.electron.ipcRenderer.invoke("store-get", "client.id").then((id) => {
      setClientId(id);
    });
  }, [clientId]);

  useEffect(() => {
    async function handler(args: string) {
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
            // TODO: do something
          } else {
            const { data, error } = await exchangeCodeForToken(
              clientId,
              provider,
              code
            );

            if (error) {
              // TODO: do something
            }

            // TODO: handle data
          }
        }
      } catch (e) {
        // TODO: do something
      }
    }

    return window.electron.ipcRenderer.on("open-url", handler);
  }, [clientId]);

  /**
   * Opens a URL in the default browser
   * @param url string representing the URL
   */
  function openOAuthWindow(url: string) {
    window.electron.ipcRenderer.sendMessage("open-link-in-browser", url);
  }

  async function providerSignIn(provider: "google" | "outlook") {
    const { data, error } = await getAuthURL(provider);

    if (error) {
      console.error(error);
      return;
    }
    openOAuthWindow(data.url);
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center">
      <div className="flex flex-col">
        <button
          onClick={() => providerSignIn("google")}
          type="button"
          className="inline-flex items-center gap-x-1.5 rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 shadow-sm hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
        >
          <GoogleLogo />
          Sign in with Google
        </button>
        <button
          type="button"
          className="mt-2 inline-flex items-center gap-x-1.5 rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 shadow-sm hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
        >
          <MicrosoftLogo />
          Sign in with Microsoft
        </button>
      </div>
      <p>client id: {clientId}</p>
      <p>render count: {renderCounter.current}</p>
    </div>
  );
}
