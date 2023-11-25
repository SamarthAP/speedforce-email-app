import {
  UserCircleIcon,
  CheckIcon,
  PlusIcon,
  XMarkIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { Menu, Transition, Dialog } from "@headlessui/react";
import { IEmail, ISelectedEmail, db } from "../lib/db";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { clearEmailFromDb } from "../lib/dexie/helpers";
import toast from "react-hot-toast";

interface AccountActionsProps {
  selectedEmail: ISelectedEmail;
  setSelectedEmail: (email: IEmail) => void;
  handleMouseEnter: (
    event: React.MouseEvent<HTMLElement>,
    message: string
  ) => void;
  handleMouseLeave: () => void;
}

export default function AccountActions(props: AccountActionsProps) {
  const navigate = useNavigate();

  const signedInEmails = useLiveQuery(() => {
    return db.emails.orderBy("email").toArray();
  }, []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [signOutEmail, setSignOutEmail] = useState<string>("");

  const handleClickSignOut = async (email: string) => {
    setSignOutEmail(email);
    setIsDialogOpen(true);
  };

  const signOut = async (email: string) => {
    const error = await clearEmailFromDb(email);
    if (!error) {
      toast.success(`Signed out of ${email}`);
    } else {
      toast.error(`Error signing out of ${email}`);
    }

    setIsDialogOpen(false);
  };

  return (
    <div className="relative flex flex-col items-center">
      <Menu>
        <Menu.Button
          className="mr-3"
          onMouseEnter={(event: React.MouseEvent<HTMLElement>) => {
            props.handleMouseEnter(event, "Account Actions");
          }}
          onMouseLeave={() => {
            props.handleMouseLeave();
          }}
        >
          <UserCircleIcon className="h-6 w-6 mr-3 shrink-0 text-black dark:text-white" />
        </Menu.Button>
        <Transition
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          <Menu.Items className="absolute right-0 shadow-2xl p-2 bg-white">
            <div className="bg-white flex flex-row justify-between items-center">
              <div className="flex flex-row items-center">
                <div className="px-2 py-2">
                  <UserCircleIcon className="h-4 w-4 shrink-0 text-black" />
                </div>

                <div className="px-2 py-2 text-sm">My Accounts</div>
              </div>
              <Menu.Item>
                <XMarkIcon className="h-4 w-4 shrink-0 text-black hover:bg-slate-100 rounded-full cursor-pointer" />
              </Menu.Item>
            </div>
            <hr className="mb-2" />

            {signedInEmails?.map((email) => (
              <Menu.Item key={email.email}>
                {({ active }) => (
                  <div className="flex flex-row items-center">
                    <div
                      className="py-2 px-2 bg-white hover:bg-slate-100 rounded-md"
                      onClick={() => void handleClickSignOut(email.email)}
                    >
                      <ArrowLeftOnRectangleIcon className="h-4 w-4 shrink-0 text-black cursor-pointer" />
                    </div>
                    <div
                      className="w-full flex flex-row px-2 py-2 bg-white hover:bg-slate-100 justify-between items-center rounded-md cursor-pointer"
                      key={email.email}
                      onClick={() => void props.setSelectedEmail(email)}
                    >
                      <div className="text-sm">{email.email}</div>
                    </div>
                    {email.email === props.selectedEmail.email ? (
                      <CheckIcon className="h-4 w-4 shrink-0 text-black" />
                    ) : (
                      // Spacer
                      <div className="h-4 w-4 ml-2"></div>
                    )}
                  </div>
                )}
              </Menu.Item>
            ))}

            {/* <hr className="my-2"/> */}
            <Menu.Item>
              {({ active }) => (
                <div
                  className="py-2 px-2 bg-white hover:bg-slate-100 flex flex-row items-center rounded-md cursor-pointer"
                  onClick={() => navigate("/page/addAccount")}
                >
                  <PlusIcon className="h-4 w-4 shrink-0 text-black" />
                  <div className="text-sm px-2 ml-2">Add Account</div>
                </div>
              )}
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>

      <Transition.Root show={isDialogOpen}>
        <Dialog as="div" className="relative z-10" onClose={setIsDialogOpen}>
          <Transition.Child
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div>
                    <div className="mt-3 text-center sm:mt-5">
                      <Dialog.Title
                        as="h3"
                        className="text-base font-semibold leading-6 text-gray-900"
                      >
                        Sign Out
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to sign out of {signOutEmail}?
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 sm:col-start-2"
                      onClick={() => void signOut(signOutEmail)}
                    >
                      Yes, sign out
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
}
