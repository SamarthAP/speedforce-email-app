import { Transition, Dialog } from "@headlessui/react";
import { useState } from "react";

interface LinkProps {
  textToDisplay: string;
  setTextToDisplay: (text: string) => void;
  isLinkToWeb: boolean;
  setIsLinkToWeb: (isLinkToWeb: boolean) => void;
  linkURI: string;
  setLinkURI: (linkURI: string) => void;
  url: string;
}

interface AddLinkModalProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (isOpen: boolean) => void;
}

export const AddLinkModal = ({
  isDialogOpen,
  setIsDialogOpen,
}: AddLinkModalProps) => {
  const [textToDisplay, setTextToDisplay] = useState("");

  return (
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:p-6">
                <div>
                  <div className="text-start">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900"
                    >
                      Add link
                    </Dialog.Title>
                    <div className="mt-2">
                      <span className="flex flex-row items-center space-x-4">
                        <div className="italic w-32 whitespace-nowrap">
                          Text to display:
                        </div>
                        <input
                          type="text"
                          className="block w-96 rounded-md border-0 py-2 px-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:outline-none text-sm leading-6"
                          placeholder="..."
                          value={textToDisplay}
                          onChange={(e) => setTextToDisplay(e.target.value)}
                        />
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="flex flex-row items-center space-x-4">
                        <div className="italic w-32 whitespace-nowrap">
                          Link:
                        </div>
                        <input
                          type="text"
                          className="block w-96 rounded-md border-0 py-2 px-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:outline-none text-sm leading-6"
                          placeholder="..."
                          value={textToDisplay}
                          onChange={(e) => setTextToDisplay(e.target.value)}
                        />
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 sm:col-start-2"
                    onClick={() => {
                      console.log("yooooo");
                      setIsDialogOpen(false);
                    }}
                  >
                    Add link
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
  );
};
