import { useState } from "react";
// import MeshGradient from "../assets/meshgradient.svg";
import supabase from "../lib/supabase";
import LoginOTPModal from "../components/modals/LoginOTPModal";
import toast from "react-hot-toast";
import { Tab } from "@headlessui/react";
import { classNames } from "../lib/util";
import { z } from "zod";

const tabs = ["Login", "Sign Up"];

export default function Login() {
  const [selectedTabIndex, setSelectedTabIndex] = useState<number>(0);
  const [open, setOpen] = useState({
    open: false,
    phone: "",
  });
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    if (phone !== "") {
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
      } else {
        toast(error.message);
      }
    } else if (email !== "" && password !== "") {
      if (password.length < 8) {
        toast("Password must be at least 8 characters");
        return;
      }

      const { success } = z.string().email().safeParse(email);

      if (!success) {
        toast("Invalid email");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast(error.message);
      }
    }
  }

  async function supabaseSignUp() {
    if (phone !== "") {
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
      } else {
        toast(error.message);
      }
    } else if (email !== "" && password !== "") {
      if (password.length < 8) {
        toast("Password must be at least 8 characters");
        return;
      }

      const { success } = z.string().email().safeParse(email);

      if (!success) {
        toast("Invalid email");
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        toast(error.message);
      } else {
        toast(
          "Account created, please check your email for a verification link and then log in",
          {
            duration: 10000,
          }
        );
      }
    }
  }

  return (
    <div className="w-screen h-screen bg-zinc-900">
      <div className={`grid grid-cols-10 grid-rows-1 border-b border-zinc-700`}>
        <div className="col-span-1"></div>

        <div
          className={`col-span-8 h-[32px] flex items-center justify-center text-xs flex-shrink-0 drag-frame text-white`}
        >
          It&apos;s time to enter the
        </div>
      </div>
      <div className="pt-4">
        <h1 className="text-6xl font-bold text-white text-center mb-4">
          Speedforce
        </h1>
        <Tab.Group
          selectedIndex={selectedTabIndex}
          onChange={setSelectedTabIndex}
        >
          <Tab.List
            className={
              "flex space-x-1 w-96 mx-auto rounded-lg bg-slate-200 dark:bg-zinc-700 p-1"
            }
          >
            {tabs.map((tab) => (
              <Tab
                key={tab}
                className={({ selected }) => {
                  return classNames(
                    "w-full rounded-md py-0.5 text-xs font-medium leading-5",
                    "focus:outline-none",
                    selected
                      ? "bg-white dark:bg-zinc-900 text-black dark:text-white shadow"
                      : "text-slate-700 dark:text-zinc-200 hover:bg-slate-300 dark:hover:bg-zinc-600"
                  );
                }}
              >
                {tab}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels>
            <div className="w-96 mx-auto p-2">
              <Tab.Panel className="text-white">
                <LoginOTPModal phone={open.phone} open={open.open} />
                <p className="mb-1 text-white">Phone Number</p>
                <div className="flex flex-col">
                  <div>
                    <div className="mt-2">
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        className="block w-full rounded-md border-0 py-2 px-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:outline-none text-sm leading-6"
                        placeholder="+14448880000"
                        disabled={email !== "" || password !== ""}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <p className="my-2 text-white">OR Email + Password</p>
                <div className="flex flex-col">
                  <div>
                    <div className="mt-2">
                      <input
                        type="email"
                        className="block w-full rounded-t-md border-0 py-2 px-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:outline-none text-sm leading-6"
                        placeholder="Email"
                        disabled={phone !== ""}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <input
                        type="password"
                        className="block w-full rounded-b-md border-0 py-2 px-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:outline-none text-sm leading-6"
                        placeholder="Password"
                        disabled={phone !== ""}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-md bg-zinc-700 px-3 py-2 mt-4 text-sm font-semibold text-white shadow-sm disabled:hover:bg-zinc-700 hover:bg-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        disabled={
                          !(phone !== "" || (email !== "" && password !== ""))
                        }
                        onClick={() => {
                          void supabaseLogin();
                        }}
                      >
                        Log in
                      </button>
                    </div>
                  </div>
                </div>
              </Tab.Panel>
              <Tab.Panel className="text-white">
                <LoginOTPModal phone={open.phone} open={open.open} />
                <p className="mb-1 text-white">Phone Number</p>
                <div className="flex flex-col">
                  <div>
                    <div className="mt-2">
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        className="block w-full rounded-md border-0 py-2 px-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:outline-none text-sm leading-6"
                        placeholder="+14448880000"
                        disabled={email !== "" || password !== ""}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <p className="my-2 text-white">OR Email + Password</p>
                <div className="flex flex-col">
                  <div>
                    <div className="mt-2">
                      <input
                        type="email"
                        className="block w-full rounded-t-md border-0 py-2 px-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:outline-none text-sm leading-6"
                        placeholder="Email"
                        disabled={phone !== ""}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <input
                        type="password"
                        className="block w-full rounded-b-md border-0 py-2 px-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:outline-none text-sm leading-6"
                        placeholder="Password, 8 characters min"
                        disabled={phone !== ""}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-md bg-zinc-700 px-3 py-2 mt-4 text-sm font-semibold text-white shadow-sm disabled:hover:bg-zinc-700 hover:bg-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        disabled={
                          !(phone !== "" || (email !== "" && password !== ""))
                        }
                        onClick={() => {
                          void supabaseSignUp();
                        }}
                      >
                        Sign Up
                      </button>
                    </div>
                  </div>
                </div>
              </Tab.Panel>
            </div>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
