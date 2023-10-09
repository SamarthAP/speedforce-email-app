import {
  ClipboardDocumentIcon,
  ClockIcon,
  ExclamationCircleIcon,
  InboxIcon,
  PaperAirplaneIcon,
  TrashIcon,
  StarIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";

import { useNavigate } from "react-router-dom";
import Tooltip from "./Tooltip";

const navigation = [
  { name: "Inbox", href: "/", icon: InboxIcon, current: false },
  { name: "Starred", href: "/starred", icon: StarIcon, current: false },
  { name: "Sent", href: "/sent", icon: PaperAirplaneIcon, current: false },
  {
    name: "Drafts",
    href: "/drafts",
    icon: ClipboardDocumentIcon,
    current: false,
  },
  { name: "Done", href: "/done", icon: ArchiveBoxIcon, current: false },
  { name: "Spam", href: "/spam", icon: ExclamationCircleIcon, current: false },
  { name: "Deleted Items", href: "/deleted", icon: TrashIcon, current: false },
  { name: "Scheduled", href: "#", icon: ClockIcon, current: false },
  // {
  //   name: "Add Account",
  //   href: "/page/addAccount",
  //   icon: PlusIcon,
  //   current: false,
  // },
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <div className="flex-shrink-0 w-20 overflow-y-auto pb-4 h-full overflow-hidden">
      {/* <div className="flex h-16 shrink-0 items-center justify-center cursor-pointer">
        <div className="text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold">
          <ViewColumnsIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
        </div>
      </div> */}
      <nav className="mt-4 overflow-scroll pb-4">
        <ul role="list" className="flex flex-col items-center space-y-1">
          {navigation.map((item) => (
            <li className="cursor-pointer" key={item.name}>
              <div
                onClick={() => navigate(item.href)}
                className={`
                ${
                  item.current
                    ? "bg-slate-100 dark:bg-zinc-800"
                    : "hover:bg-slate-100 dark:hover:bg-zinc-800"
                } 'group flex gap-x-3 rounded-md p-3 text-sm text-slate-600 dark:text-zinc-300 leading-6 font-semibold'
              `}
              >
                <Tooltip text={item.name == "Deleted Items" ? 'Deleted' : item.name}>
                  <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                </Tooltip>
                <span className="sr-only">{item.name}</span>
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </div>
    // <div className="h-screen w-[200px] min-w-[256px] bg-slate-300 text-white flex flex-col items-center justify-center">
    //   <div>hello</div>
    //   <button
    //     type="button"
    //     onClick={() => navigate("/addAccount")}
    //     className="bg-slate-500 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded"
    //   >
    //     Go to Add Account
    //   </button>
    // </div>
    // <Transition.Root show={open} as={Fragment}>
    //   <Dialog as="div" className="relative z-10" onClose={setOpen}>
    //     <div className="fixed inset-0" />

    //     <div className="fixed inset-0 overflow-hidden">
    //       <div className="absolute inset-0 overflow-hidden">
    //         <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full">
    //           <Transition.Child
    //             as={Fragment}
    //             enter="transform transition ease-in-out duration-500 sm:duration-700"
    //             enterFrom="-translate-x-full"
    //             enterTo="translate-x-0"
    //             leave="transform transition ease-in-out duration-500 sm:duration-700"
    //             leaveFrom="translate-x-0"
    //             leaveTo="-translate-x-full"
    //           >
    //             <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
    //               <div className="flex h-full flex-col overflow-y-scroll py-6 shadow-xl rounded-r-2xl border-r bg-[rgba(1,1,1,0.2)] backdrop-blur-[8px]">
    //                 <div className="px-4 sm:px-6">
    //                   <div className="flex items-start justify-between">
    //                     <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
    //                       Sidebar
    //                     </Dialog.Title>
    //                     <div className="ml-3 flex h-7 items-center">
    //                       <button
    //                         type="button"
    //                         className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    //                         onClick={() => setOpen(false)}
    //                       >
    //                         <span className="sr-only">Close panel</span>
    //                         <XMarkIcon className="h-6 w-6" aria-hidden="true" />
    //                       </button>
    //                     </div>
    //                   </div>
    //                 </div>
    //                 <div className="relative mt-6 flex-1 px-4 sm:px-6">
    //                   <button
    //                     type="button"
    //                     onClick={() => navigate("/addAccount")}
    //                     className="bg-slate-500 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded"
    //                   >
    //                     Go to Add Account
    //                   </button>
    //                 </div>
    //               </div>
    //             </Dialog.Panel>
    //           </Transition.Child>
    //         </div>
    //       </div>
    //     </div>
    //   </Dialog>
    // </Transition.Root>
  );
}
// <div className="h-screen w-[200px] min-w-[256px] bg-slate-300 text-white flex flex-col items-center justify-center">
//   <div>hello</div>
// <button
//   type="button"
//   onClick={() => navigate("/addAccount")}
//   className="bg-slate-500 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded"
// >
//   Go to Add Account
// </button>
// </div>
