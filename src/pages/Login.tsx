import { useEffect } from "react";
import GoogleLogo from "../assets/googleLogo.svg";
import MicrosoftLogo from "../assets/microsoftLogo.svg";
import supabase from "../lib/supabase";
import { Provider } from "@supabase/supabase-js";

export default function Login() {
  async function supabaseLogin(provider: Provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: "https://speedforce.me/auth/login", // This is also set in Supabase Dashboard
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      // TODO: handle error
      console.log(error);
    }

    window.electron.ipcRenderer.sendMessage("open-link-in-browser", data.url);
  }

  // receives deep link from main process
  useEffect(() => {
    window.electron.ipcRenderer.on("open-url", async (args) => {
      try {
        const url = new URL(args as string);
        const code = url.searchParams.get("code");
        if (code) {
          if (code === "error") {
            // do something
          } else {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              // TODO: make them log in again
              console.log(error);
            }
          }
        }
      } catch (e) {
        // TODO: make them log in again
        console.log(e);
      }
    });
  }, []);

  return (
    <div className="flex flex-col h-screen place-items-center bg-gradient-to-bl from-slate-400 via-slate-100 to-slate-400">
      <div className="m-auto text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Welcome to Speedforce
        </h1>
        <p className="mt-4 text-lg leading-8 text-gray-600">
          Sign up with one of the following
        </p>
        <div className="flex flex-col items-center">
          <button
            onClick={() => supabaseLogin("google")}
            className="mt-8 bg-gray-100 w-2/5 flex p-1 rounded-md  border-gray-300 border hover:bg-gray-200"
          >
            <GoogleLogo />
            <div className="rounded px-3 py-3 text-lg font-semibold text-gray-600 shadow-sm">
              Google
            </div>
          </button>
          <button className="mt-2 bg-gray-100 w-2/5 flex p-1 rounded-md border-gray-300 border hover:bg-gray-200">
            <MicrosoftLogo />
            <div className="rounded px-3 py-3 text-lg font-semibold text-gray-600 shadow-sm">
              Microsoft
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
