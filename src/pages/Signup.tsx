import { useEffect, useState } from "react";
import GoogleLogo from "../assets/googleLogo.svg";
import MicrosoftLogo from "../assets/microsoftLogo.svg";

// // Google sign in
// async function signInWithGoogle() {
//   console.log("Google sign in");
// }

// //Google sign out
// async function signoutGoogle() {
//   console.log("Google sign out");
// }

// //Azure sign in
// async function signInWithAzure() {
//   console.log("Azure sign in");
// }

// //Azure sign out
// async function signoutAzure() {
//   console.log("Azure sign out");
// }

export default function Signup() {
  const [test, setTest] = useState("test");

  // receives deep link from main process
  useEffect(() => {
    window.electron.ipcRenderer.on("open-url", (args) => {
      setTest(args as string);
    });
  }, [test]);

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
          <a
            href="#"
            className="mt-8 bg-gray-100 w-2/5 flex p-1 rounded-md  border-gray-300 border hover:bg-gray-200"
          >
            <GoogleLogo />
            <div className="rounded px-3 py-3 text-lg font-semibold text-gray-600 shadow-sm">
              Google
            </div>
          </a>
          <a
            href="#"
            className="mt-2 bg-gray-100 w-2/5 flex p-1 rounded-md border-gray-300 border hover:bg-gray-200"
          >
            <MicrosoftLogo />
            <div className="rounded px-3 py-3 text-lg font-semibold text-gray-600 shadow-sm">
              Microsoft
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
