import { useEffect, useRef, useState } from "react";
import { exchangeCodeForToken, getAuthURL } from "../api/auth";
import GoogleLogo from "../assets/googleLogo.svg";
import MicrosoftLogo from "../assets/microsoftLogo.svg";
import { db } from "../lib/db";
import { useNavigate } from "react-router-dom";

async function insertEmail(
  email: string,
  provider: string,
  accessToken: string,
  expiresAt: number
) {
  await db.emails.put({
    email,
    provider,
    accessToken,
    expiresAt,
  });
}

export default function AddAccount() {
  const navigate = useNavigate();
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

            if (error || !data) {
              // TODO: do something
              return;
            }

            // TODO: handle data and set current email
            await insertEmail(
              data.email,
              data.provider,
              data.accessToken,
              data.expiresAt
            );
          }
        }
      } catch (e) {
        // TODO: do something
      }
    }

    // return window.electron.ipcRenderer.on("open-url", handler);
    return window.electron.ipcRenderer.onOpenUrl(handler);
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

    if (error || !data) {
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
      {process.env.NODE_ENV === "development" && (
        <button
          onClick={() => {
            insertEmail(
              "samarth@sigilinnovation.com",
              "google",
              "ya29.something",
              1688333423087 // new Date().getTime()
            );
          }}
          className="mt-2 inline-flex items-center gap-x-1.5 rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 shadow-sm hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
        >
          Manually Add Email to DB
        </button>
      )}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="mt-2 inline-flex items-center gap-x-1.5 rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 shadow-sm hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
      >
        Go To Home
      </button>
      <p>client id: {clientId}</p>
      <p>render count: {renderCounter.current}</p>
    </div>
  );
}
