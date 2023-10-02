import { useEffect, useRef, useState } from "react";
import { exchangeCodeForToken, getAuthURL } from "../api/auth";
import GoogleLogo from "../assets/googleLogo.svg";
import MicrosoftLogo from "../assets/microsoftLogo.svg";
import { db } from "../lib/db";
import { useNavigate } from "react-router-dom";
import Titlebar from "../components/Titlebar";
import { cleanIndexedDb } from "../lib/experiments";
import { runNotProd } from "../lib/noProd";

async function insertEmail(
  email: string,
  provider: "google" | "outlook",
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

const manualInsertEmail = async () => {
  await insertEmail(
    "samarth@sigilinnovation.com",
    "google",
    "ya29.something",
    1688333423087 // new Date().getTime()
  );

  await db.selectedEmail.put({
    id: 1,
    email: "samarth@sigilinnovation.com",
    provider: "google",
  });

  await db.googleMetadata.put({
    email: "samarth@sigilinnovation.com",
    threadsListNextPageTokens: [],
  });
};

export default function AddAccount() {
  const navigate = useNavigate();
  const [clientId, setClientId] = useState("");
  const [appVersion, setAppVersion] = useState("");
  const renderCounter = useRef(0);
  renderCounter.current = renderCounter.current + 1;

  useEffect(() => {
    void window.electron.ipcRenderer
      .invoke("store-get", "client.id")
      .then((id) => {
        setClientId(id);
      });
  }, [clientId]);

  useEffect(() => {
    void window.electron.ipcRenderer
      .invoke("get-app-version")
      .then((version) => {
        setAppVersion(version);
      });
  }, [appVersion]);

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

            // handle data and set current email
            await insertEmail(
              data.email,
              data.provider,
              data.accessToken,
              data.expiresAt
            );

            await db.selectedEmail.put({
              id: 1,
              email: data.email,
              provider: data.provider,
            });

            if (data.provider === "google") {
              await db.googleMetadata.put({
                email: data.email,
                threadsListNextPageTokens: [],
              });
            } else {
              await db.outlookMetadata.put({
                email: data.email,
                threadsListNextPageTokens: [],
              });
            }
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
    <div className="h-screen w-screen flex flex-col dark:bg-zinc-900">
      <Titlebar />
      <div className="h-full w-screen flex flex-col items-center justify-center">
        <div className="flex flex-col">
          <button
            onClick={() => void providerSignIn("google")}
            type="button"
            className="inline-flex items-center gap-x-1.5 rounded-md bg-slate-200 dark:bg-zinc-700 px-3 py-2 text-sm font-semibold text-slate-600 dark:text-zinc-300 shadow-sm hover:bg-gray-300 dark:hover:bg-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
          >
            <GoogleLogo />
            Sign in with Google
          </button>
          <button
            onClick={() => void providerSignIn("outlook")}
            type="button"
            className="mt-2 inline-flex items-center gap-x-1.5 rounded-md bg-slate-200 dark:bg-zinc-700 px-3 py-2 text-sm font-semibold text-slate-600 dark:text-zinc-300 shadow-sm hover:bg-gray-300 dark:hover:bg-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
          >
            <MicrosoftLogo />
            Sign in with Microsoft
          </button>
        </div>
        {runNotProd(() => (
          <>
            <button
              onClick={() => void manualInsertEmail()}
              className="mt-2 inline-flex items-center gap-x-1.5 rounded-md bg-slate-200 dark:bg-zinc-700 px-3 py-2 text-sm font-semibold text-slate-600 dark:text-zinc-300 shadow-sm hover:bg-gray-300 dark:hover:bg-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
            >
              Manually Add Email to DB
            </button>
            <button
              onClick={() => void cleanIndexedDb()}
              className="mt-2 inline-flex items-center gap-x-1.5 rounded-md bg-slate-200 dark:bg-zinc-700 px-3 py-2 text-sm font-semibold text-slate-600 dark:text-zinc-300 shadow-sm hover:bg-gray-300 dark:hover:bg-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
            >
              Delete IndexedDB
            </button>
          </>
        )) || null}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-2 inline-flex items-center gap-x-1.5 rounded-md bg-slate-200 dark:bg-zinc-700 px-3 py-2 text-sm font-semibold text-slate-600 dark:text-zinc-300 shadow-sm hover:bg-gray-300 dark:hover:bg-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
        >
          Go To Home
        </button>
        {runNotProd(() => {
          return (
            <>
              <p className="dark:text-white">client id: {clientId}</p>
              <p className="dark:text-white">
                render count: {renderCounter.current}
              </p>
              <p className="dark:text-white">app version: {appVersion}</p>
              <p className="dark:text-white">schema version: {db.verno}</p>
            </>
          );
        }) || null}
      </div>
    </div>
  );
}
