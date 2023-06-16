import { useEffect, useState } from "react";
// import MeshGradient from "../assets/meshgradient.svg";
import supabase from "../lib/supabase";
import LoginOTPModal from "../components/modals/LoginOTPModal";

export default function Login() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");

  async function supabaseLogin() {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (!error) {
      setOpen(true);
    }
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
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-maroongradient">
      <LoginOTPModal phone={phone} open={open} setOpen={setOpen} />

      <h1 className="text-6xl font-bold text-white">Speedforce</h1>
      <p className="my-8 text-white">
        Log in with your phone number to get started
      </p>
      <div className="flex flex-col">
        <div>
          {/* <label
            htmlFor="phone"
            className="block text-sm font-medium leading-6 text-white"
          >
            Phone Number
          </label> */}
          <div className="mt-2">
            <input
              type="tel"
              name="phone"
              id="phone"
              className="block w-full rounded-md border-0 py-2 px-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:outline-none text-sm leading-6"
              placeholder="+14448880000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md bg-gray-900 px-3 py-2 mt-4 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              onClick={() => {
                supabaseLogin();
              }}
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}