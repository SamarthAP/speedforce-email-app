import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

import { useNavigate } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  return (
    <div className="h-screen w-[200px] min-w-[256px] bg-slate-300 text-white flex flex-col items-center justify-center">
      <div>hello</div>
      <button
        type="button"
        onClick={() => navigate("/addAccount")}
        className="bg-slate-500 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded"
      >
        Go to Add Account
      </button>
    </div>
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
