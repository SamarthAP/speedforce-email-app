import { useEffect, useState } from "react";
import { getAuthURL } from "../api/auth";
import GoogleLogo from "../assets/googleLogo.svg";
import MicrosoftLogo from "../assets/microsoftLogo.svg";

export default function AddAccount() {
  const [clientId, setClientId] = useState("");

  useEffect(() => {
    window.electron.ipcRenderer.invoke("store-get", "client.id").then((id) => {
      setClientId(id);
    });
  }, [clientId]);

  // Old code for reference:
  // useEffect(() => {
  //   window.electron.ipcRenderer.on("open-url", async (args) => {
  //     try {
  //       const url = new URL(args as string);
  //       const code = url.searchParams.get("code");
  //       if (code) {
  //         if (code === "error") {
  //           // do something
  //         } else {
  //           const { error } = await supabase.auth.exchangeCodeForSession(code);
  //           if (error) {
  //             // TODO: make them log in again
  //             console.log(error);
  //           }
  //         }
  //       }
  //     } catch (e) {
  //       // TODO: make them log in again
  //       console.log(e);
  //     }
  //   });
  // }, []);
  useEffect(() => {
    window.electron.ipcRenderer.on("open-url", (args) => {
      console.log(args as string);
    });
  }, []);

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
        <p>client id: {clientId}</p>
      </div>
    </div>
  );
}
