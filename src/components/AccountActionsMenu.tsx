import {
  UserCircleIcon,
  CheckIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Menu, Transition } from "@headlessui/react";
import { IEmail, ISelectedEmail, db } from "../lib/db";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";

interface AccountActionsProps {
  selectedEmail: ISelectedEmail;
  setSelectedEmail: (email: IEmail) => void;
}

export default function AccountActions(props: AccountActionsProps) {
  const navigate = useNavigate();

  const signedInEmails = useLiveQuery(() => {
    return db.emails.orderBy("email").toArray();
  }, []);

  return (
    <div className="relative">
      <Menu>
        <Menu.Button>
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
            <div className="pl-1 pr-1 py-2 bg-white flex flex-row justify-between items-center">
              <div className="flex flex-row">
                <UserCircleIcon className="h-6 w-6 shrink-0 text-black mr-3" />
                <div className="text-md mr-3">My Accounts</div>
              </div>
              <Menu.Item>
                <XMarkIcon className="h-7 w-7 shrink-0 text-black hover:bg-gray-200 rounded-full p-1" />
              </Menu.Item>
            </div>
            <hr className="mb-2" />

            {signedInEmails?.map((email) => (
              <Menu.Item key={email.email}>
                {({ active }) => (
                  <div
                    className="pl-5 pr-2 py-2 bg-white hover:bg-gray-200 flex flex-row justify-between items-center"
                    key={email.email}
                    onClick={() => void props.setSelectedEmail(email)}
                  >
                    <div className="text-md mr-5">{email.email}</div>
                    {email.email === props.selectedEmail.email ? (
                      <CheckIcon className="h-4 w-4 shrink-0 text-black" />
                    ) : (
                      // Spacer
                      <div className="h-4 w-4"></div>
                    )}
                  </div>
                )}
              </Menu.Item>
            ))}

            {/* <hr className="my-2"/> */}
            <Menu.Item>
              {({ active }) => (
                <div
                  className="px-5 py-2 bg-white hover:bg-gray-200 flex flex-row items-center"
                  onClick={() => navigate("/page/addAccount")}
                >
                  <PlusIcon className="h-4 w-4 shrink-0 text-black" />
                  <div className="text-md ml-2">Add Account</div>
                </div>
              )}
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}
