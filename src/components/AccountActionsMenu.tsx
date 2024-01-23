import {
  UserCircleIcon,
  CheckIcon,
  PlusIcon,
  XMarkIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { Menu, Transition } from "@headlessui/react";
import { IEmail, ISelectedEmail, db } from "../lib/db";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { clearEmailFromDb } from "../lib/dexie/helpers";
import toast from "react-hot-toast";
import { classNames } from "../lib/util";
import { useInboxZeroBackgroundContext } from "../contexts/InboxZeroBackgroundContext";
import { ConfirmModal } from "./modals/ConfirmModal";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [signOutEmail, setSignOutEmail] = useState<string>("");
  const { isBackgroundOn } = useInboxZeroBackgroundContext();

  const signedInEmails = useLiveQuery(() => {
    return db.emails.orderBy("email").toArray();
  }, []);

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
    <div className="flex flex-col items-center z-10">
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
          <UserCircleIcon
            className={classNames(
              "h-5 w-5 shrink-0",
              isBackgroundOn ? "text-white" : "text-black dark:text-white"
            )}
          />
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
      <ConfirmModal
        dialogTitle="Sign Out"
        dialogMessage={`Are you sure you want to sign out of ${signOutEmail}?`}
        confirmButtonText="Yes, sign out"
        confirmButtonAction={() => void signOut(signOutEmail)}
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
      />
    </div>
  );
}
