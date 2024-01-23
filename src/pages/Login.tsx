import { useState } from "react";
// import MeshGradient from "../assets/meshgradient.svg";
import supabase from "../lib/supabase";
import LoginOTPModal from "../components/modals/LoginOTPModal";
import toast from "react-hot-toast";

export default function Login() {
  const [open, setOpen] = useState({
    open: false,
    phone: "",
  });
  const [phone, setPhone] = useState("");

  const parsePhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    let phoneNumber: string | null = null;
    let err: string | null = null;

    if (digits.length === 10) {
      phoneNumber = `+1${digits}`;
    } else if (digits.length === 11) {
      phoneNumber = `+${digits}`;
    } else {
      err = "Invalid phone number";
    }

    return { phoneNumber, err };
  };

  async function supabaseLogin() {
    const { phoneNumber, err } = parsePhoneNumber(phone);
    if (err || !phoneNumber) {
      toast("Invalid phone number");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone: phoneNumber,
    });

    if (!error) {
      setOpen({
        open: true,
        phone: phoneNumber,
      });
    }
  }

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-zinc-900">
      <LoginOTPModal phone={open.phone} open={open.open} />

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
              className="inline-flex w-full justify-center rounded-md bg-zinc-700 px-3 py-2 mt-4 text-sm font-semibold text-white shadow-sm hover:bg-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              onClick={() => {
                void supabaseLogin();
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
