import { Transition, Dialog, Popover, Combobox } from "@headlessui/react";
import { IContact, ISelectedEmail, db } from "../../lib/db";
import React, { useCallback, useEffect, useState } from "react";
import { ChevronUpDownIcon, CheckIcon } from "@heroicons/react/24/outline";
import { classNames } from "../../lib/util";
import toast from "react-hot-toast";
import { string } from "zod";
import { useLiveQuery } from "dexie-react-hooks";
import { updateDraftParticipants } from "../../api/drafts";
import { DraftAccessType } from "../../api/model/users.draft";

const emailSchema = string().email({ message: "Invalid email" });

const getAccessTypeString = (accessType: DraftAccessType) => {
  switch (accessType) {
    case DraftAccessType.OWNER:
      return "Owner";
    case DraftAccessType.VIEW:
      return "Read Only";
    case DraftAccessType.EDIT:
      return "Editor";
  }
};

const isValidEmail = (forbiddenEmails: string[], email: string) => {
  try {
    emailSchema.parse(email); // If email is invalid, this will throw an error
    return !forbiddenEmails.includes(email);
  } catch (error) {
    return false;
  }
};

interface SharedDraftOwnerProps {
  email: string;
}

const SharedDraftOwner = ({ email }: SharedDraftOwnerProps) => {
  return (
    <span className="ml-2 my-2 flex flex-row items-center justify-between">
      <div className="text-base">
        {email} <span className="italic text-sm text-gray-400">(you)</span>
      </div>
      <span className="italic text-sm text-gray-400">Owner</span>
    </span>
  );
};

interface SharedDraftParticipantProps {
  email: string;
  accessType: DraftAccessType;
  setAccessType: (accessType: DraftAccessType) => void;
  participants: { email: string; accessType: DraftAccessType }[];
  setParticipants: (
    participants: { email: string; accessType: DraftAccessType }[]
  ) => void;
}

const SharedDraftParticipant = ({
  email,
  accessType,
  setAccessType,
  participants,
  setParticipants,
}: SharedDraftParticipantProps) => {
  return (
    <span className="ml-2 flex flex-row items-center justify-between">
      <div className="text-base">{email}</div>
      <Popover>
        <div className="relative mt-1 w-32">
          <Popover.Button className="relative w-full py-2 pl-3 pr-10 text-left bg-white rounded-lg shadow-md cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-opacity-75 focus-visible:ring-white sm:text-sm">
            <span className="block truncate">
              {getAccessTypeString(accessType)}
            </span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ChevronUpDownIcon
                className="w-5 h-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Popover.Button>
          <Popover.Panel className="absolute w-48 py-1 mt-1 right-0 overflow-auto text-base bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
            {({ close }) => (
              <React.Fragment>
                <button
                  className={classNames(
                    "w-full flex flex-row items-center cursor-default select-none py-2 px-4 text-black",
                    "hover:bg-slate-200"
                  )}
                  onClick={() => {
                    setAccessType(DraftAccessType.VIEW);
                    close();
                  }}
                >
                  <>
                    <span
                      className={classNames(
                        "block truncate",
                        accessType === DraftAccessType.VIEW
                          ? "font-medium"
                          : "font-normal"
                      )}
                    >
                      Read Only
                    </span>
                    {accessType === DraftAccessType.VIEW ? (
                      <span className="inset-y-0 left-0 flex items-center pl-3 text-slate-700">
                        <CheckIcon className="w-5 h-5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                </button>
                <button
                  className={classNames(
                    "w-full flex flex-row items-center cursor-default select-none py-2 px-4 text-black",
                    "hover:bg-slate-200"
                  )}
                  onClick={() => {
                    setAccessType(DraftAccessType.EDIT);
                    close();
                  }}
                >
                  <>
                    <span
                      className={classNames(
                        "block truncate",
                        accessType === DraftAccessType.EDIT
                          ? "font-medium"
                          : "font-normal"
                      )}
                    >
                      Editor
                    </span>
                    {accessType === DraftAccessType.EDIT ? (
                      <span className="inset-y-0 left-0 flex items-center pl-3 text-slate-700">
                        <CheckIcon className="w-5 h-5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                </button>
                <button
                  className="relative w-full cursor-default select-none py-2 px-4 text-black hover:bg-slate-200"
                  onClick={() => {
                    setParticipants(
                      participants.filter((p) => p.email !== email)
                    );
                    close();
                  }}
                >
                  <span className="block truncate font-normal w-full text-left">
                    Remove Access
                  </span>
                </button>
              </React.Fragment>
            )}
          </Popover.Panel>
        </div>
      </Popover>
    </span>
  );
};

interface SharedDraftModalProps {
  selectedEmail: ISelectedEmail;
  draftId: string;
  sharedParticipants: { email: string; accessType: DraftAccessType }[];
  isDialogOpen: boolean;
  setIsDialogOpen: (isOpen: boolean) => void;
}

export const SharedDraftModal = ({
  selectedEmail,
  draftId,
  sharedParticipants,
  isDialogOpen,
  setIsDialogOpen,
}: SharedDraftModalProps) => {
  const [participants, setParticipants] =
    useState<{ email: string; accessType: DraftAccessType }[]>(
      sharedParticipants
    );
  const [emailText, setEmailText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const userContactsList = useLiveQuery(() => {
    return db.contacts.where("email").equals(selectedEmail.email).toArray();
  }, []);

  useEffect(() => {
    if (isDialogOpen) {
      setParticipants(sharedParticipants);
    }
  }, [isDialogOpen, sharedParticipants]);

  // TODO: build a sophisticated rank algo with recent interactions (non-contacts)
  const filteredContacts =
    emailText === "" || !userContactsList
      ? []
      : userContactsList
          .filter((contact) => {
            return (
              (contact.contactEmailAddress
                .toLowerCase()
                .includes(emailText.toLowerCase()) ||
                contact.contactName
                  .toLowerCase()
                  .includes(emailText.toLowerCase())) &&
              !participants.find(
                (p) => p.email === contact.contactEmailAddress
              ) &&
              isValidEmail(
                participants.map((p) => p.email).concat(selectedEmail.email),
                contact.contactEmailAddress
              )
            );
          })
          .slice(0, 5);

  const onEmailKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      // Validate email and add to send list
      if (
        isValidEmail(
          participants.map((p) => p.email).concat(selectedEmail.email),
          emailText
        )
      ) {
        setParticipants([
          ...participants,
          { email: emailText, accessType: DraftAccessType.EDIT },
        ]);
        setEmailText("");
      }
    }
  };

  const onSearchSelect = (contact: IContact) => {
    setParticipants([
      ...participants,
      {
        email: contact.contactEmailAddress,
        accessType: DraftAccessType.EDIT,
      },
    ]);
    setEmailText("");
  };

  const handleOnClickDone = useCallback(async () => {
    setSubmitting(true);

    const { error } = await updateDraftParticipants(
      selectedEmail.email,
      draftId,
      participants.map((participant) => ({
        email: participant.email,
        accessLevel: participant.accessType,
      }))
    );

    if (error) {
      toast.error("Error updating shared draft");
    } else {
      toast.success("Successfully updated draft");
    }

    setParticipants([]);
    setIsDialogOpen(false);
    setSubmitting(false);
  }, [draftId, participants, selectedEmail.email, setIsDialogOpen]);

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
              <Dialog.Panel className="relative transform rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all w-[calc(30rem)] overflow-visible">
                <div className="text-start">
                  <Dialog.Title
                    as="h3"
                    className="text-base font-semibold leading-6 text-gray-900"
                  >
                    Share Draft
                  </Dialog.Title>
                </div>
                <div className="mt-4 flex">
                  <Combobox
                    as="div"
                    className="w-full"
                    onChange={onSearchSelect}
                  >
                    <Combobox.Input
                      value={emailText}
                      onChange={(e) => setEmailText(e.target.value)}
                      onKeyDown={onEmailKeyDown}
                      className={classNames(
                        "block h-full w-full px-3 py-2 bg-transparent",
                        "text-black placeholder:text-slate-500 text-sm leading-6",
                        "border rounded-md border-slate-200 focus:outline-none"
                      )}
                      placeholder="Add people..."
                    />
                    <Combobox.Options className="absolute z-10 mt-1 rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {filteredContacts.map((person) => (
                        <Combobox.Option
                          key={person.contactEmailAddress}
                          value={person}
                          className={({ active }) =>
                            classNames(
                              "relative cursor-default select-none py-2 pl-3 pr-9",
                              active
                                ? "bg-gray-600 text-white"
                                : "text-gray-900"
                            )
                          }
                        >
                          {({ active }) => (
                            <div className="flex">
                              <span className="font-semibold whitespace-nowrap">
                                {person.contactName}
                              </span>
                              <span
                                className={classNames(
                                  "ml-2 text-gray-500",
                                  active ? "text-white" : "text-gray-500"
                                )}
                              >
                                {person.contactEmailAddress}
                              </span>
                            </div>
                          )}
                        </Combobox.Option>
                      ))}
                    </Combobox.Options>
                  </Combobox>
                  {/* <input
                    type="text"
                    value={emailText}
                    onChange={(e) => setEmailText(e.target.value)}
                    onKeyDown={(e) => onKeyDown(e)}
                    className="block h-full border border-slate-300 rounded-md w-full my-0.5 p-1.5 bg-transparent text-black focus:outline-none placeholder:text-slate-500 text-sm sm:leading-6"
                    placeholder="Add collaborators..."
                  /> */}
                </div>

                <div className="flex flex-col my-6 mx-1">
                  <div className="font-semibold text-sm">Collaborators</div>
                  <SharedDraftOwner email={selectedEmail.email} />
                  {participants.map((participant, idx) => (
                    <SharedDraftParticipant
                      key={idx}
                      email={participant.email}
                      accessType={participant.accessType}
                      setAccessType={(accessType) => {
                        setParticipants([
                          ...participants.slice(0, idx),
                          { email: participant.email, accessType },
                          ...participants.slice(idx + 1),
                        ]);
                      }}
                      participants={participants}
                      setParticipants={setParticipants}
                    />
                  ))}
                </div>
                <div className="mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 sm:col-start-2"
                    onClick={() => void handleOnClickDone()}
                    disabled={submitting}
                  >
                    Save
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
