import { Transition, Dialog } from "@headlessui/react";
import { db, IEmailTemplate, ISelectedEmail } from "../../lib/db";
import { useCallback } from "react";
import { getTemplateSnippet } from "../../lib/util";
import { useQuery } from "react-query";
import { useLiveQuery } from "dexie-react-hooks";

interface ImportTemplateProps {
  selectedEmail: ISelectedEmail;
  draftId: string;
  isDialogOpen: boolean;
  setIsDialogOpen: (isOpen: boolean) => void;
}

export const ImportTemplateModal = ({
  selectedEmail,
  draftId,
  isDialogOpen,
  setIsDialogOpen,
}: ImportTemplateProps) => {
  const templates = useLiveQuery(() => {
    return db.emailTemplates
      .where("email")
      .equals(selectedEmail.email)
      .reverse()
      .sortBy("createdAt");
  });

  const handleUpdateFromTemplate = useCallback(
    async (template: IEmailTemplate) => {
      await db.drafts.update(draftId, {
        to: template.to,
        cc: template.cc,
        bcc: template.bcc,
        subject: template.subject,
        html: template.html,
      });

      setIsDialogOpen(false);
    },
    [draftId, setIsDialogOpen]
  );

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
                      Import From Template
                    </Dialog.Title>
                    <div className="mt-6">
                      {templates && templates.length > 0 ? (
                        templates.map((template) => (
                          <div
                            key={template.createdAt}
                            className={
                              "flex flex-row items-center justify-between border-b border-gray-200 py-1.5 px-4 hover:bg-slate-100 group cursor-pointer"
                            }
                          >
                            <div
                              className="flex flex-col w-80"
                              onClick={() =>
                                void handleUpdateFromTemplate(template)
                              }
                            >
                              <div className="text-sm font-semibold text-black">
                                {template.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {getTemplateSnippet(template)}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="h-1/2 w-96">
                          <p className="text-slate-500 text-sm italic">
                            Looks like you don&apos;t have any templates saved.
                            Create a new template from a draft to import it.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
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
