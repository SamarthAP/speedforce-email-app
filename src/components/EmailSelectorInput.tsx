import React, { useState } from "react";
import { XCircleIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { useLiveQuery } from "dexie-react-hooks";
import { IContact, ISelectedEmail, db } from "../lib/db";
import { Combobox } from "@headlessui/react";
import { classNames, delay } from "../lib/util";
import { string } from "zod";

const emailSchema = string().email({ message: "Invalid email" });

// Check if email is valid and not already in the send list
const isValidEmail = (existingEmails: string[], email: string) => {
  try {
    emailSchema.parse(email); // If email is invalid, this will throw an error
    return !existingEmails.includes(email);
  } catch (error) {
    return false;
  }
};

interface SelectorFieldProps {
  selectedEmail: ISelectedEmail;
  emails: string[];
  setEmails?: (emails: string[]) => void;
  readOnly?: boolean;
}

export function SelectorField({
  selectedEmail,
  emails,
  setEmails = () => void 0,
  readOnly = false,
}: SelectorFieldProps) {
  const [emailText, setEmailText] = useState("");
  const userContactsList = useLiveQuery(() => {
    return db.contacts.where("email").equals(selectedEmail.email).toArray();
  }, []);

  if (readOnly) {
    return (
      <div className="flex flex-row flex-wrap pl-5">
        {emails.map((email, idx) => (
          <div
            key={idx}
            className="flex items-center mr-1.5 my-0.5 rounded-md bg-slate-200 dark:bg-zinc-700 px-2 py-1 text-sm font-semibold text-slate-600 dark:text-zinc-300 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 cursor-default"
          >
            <span>{email}</span>
          </div>
        ))}
      </div>
    );
  }

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
              !emails.includes(contact.contactEmailAddress) &&
              isValidEmail(emails, contact.contactEmailAddress)
            );
          })
          .slice(0, 5);

  const onEmailTextChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.value;

    if (value.includes(",") || value.includes(" ")) {
      event.preventDefault();
    } else {
      if (value === "") {
        // Delay to allow seamless deletion of emails
        // If user deletes the last character of their input, the previous email should not be deleted (only if they backspace on an empty input)
        // 100ms is long enough for synchronous deletion 99% of the time (ensure onKeyUp fires before onChange) while being imperceptible to the user
        // Without this delay, random chance that deleting the last character will also delete the previous email
        await delay(100);
      }

      setEmailText(value);
    }
  };

  const onEmailKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      event.key === "Enter" ||
      event.key === "," ||
      event.key === " " ||
      event.key === "Tab"
    ) {
      if (event.key === "Tab" && emailText.length > 0) {
        event.preventDefault();
      }

      // Validate email and add to send list
      if (isValidEmail(emails, emailText)) {
        setEmails([...emails, emailText]);
        setEmailText("");
      }
    } else if (
      event.key === "Backspace" &&
      emailText === "" &&
      emails.length > 0
    ) {
      // Remove last email from send list
      // Must fire before onChange updates emailText
      setEmails(emails.slice(0, emails.length - 1));
    }
  };

  // Add email to send list (from autocomplete)
  const onSearchSelect = (contact: IContact) => {
    setEmails([...emails, contact.contactEmailAddress]);
    setEmailText("");
  };

  return (
    <div className="flex flex-row flex-wrap pl-5">
      {emails.map((email, idx) => (
        <div
          key={idx}
          className="flex items-center mr-1.5 my-0.5 rounded-md bg-slate-200 dark:bg-zinc-700 px-2 py-1 text-sm font-semibold text-slate-600 dark:text-zinc-300 shadow-sm hover:bg-gray-300 dark:hover:bg-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 cursor-default"
        >
          <span>{email}</span>
          <button
            onClick={() => setEmails(emails.filter((_, i) => i !== idx))}
            type="button"
            className="focus:outline-none"
          >
            <XCircleIcon className="w-4 h-4 ml-1" />
          </button>
        </div>
      ))}

      <Combobox as="div" onChange={onSearchSelect}>
        <Combobox.Input
          className="block h-full border-0 my-0.5 pt-1 pb-2 bg-transparent dark:text-white text-black focus:outline-none placeholder:text-slate-500 placeholder:dark:text-zinc-400 text-sm sm:leading-6"
          placeholder="..."
          pattern=""
          value={emailText}
          onChange={(event) => void onEmailTextChange(event)}
          onKeyDown={onEmailKeyDown}
        />

        {filteredContacts.length > 0 && (
          <Combobox.Options className="absolute z-10 mt-1 left-[calc(6.5rem)] rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {filteredContacts.map((person) => (
              <Combobox.Option
                key={person.contactEmailAddress}
                value={person}
                className={({ active }) =>
                  classNames(
                    "relative cursor-default select-none py-2 pl-3 pr-9",
                    active ? "bg-gray-600 text-white" : "text-gray-900"
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
        )}
      </Combobox>
    </div>
  );
}

interface SetEmailFieldProps {
  text?: string;
  emails: string[];
  setEmails?: (emails: string[]) => void;
}

interface EmailSelectorInputProps {
  selectedEmail: ISelectedEmail;
  toProps: SetEmailFieldProps;
  ccProps: SetEmailFieldProps;
  bccProps: SetEmailFieldProps;
  alignLabels?: "left" | "right";
  disableCC?: boolean;
  readOnly?: boolean;
}

export function EmailSelectorInput({
  selectedEmail,
  toProps,
  ccProps,
  bccProps,
  alignLabels = "right",
  disableCC = false,
  readOnly = false,
}: EmailSelectorInputProps) {
  const [ccExpanded, setCcExpanded] = useState(false);

  return (
    <div className="relative w-full">
      {/* first field toggles CC and BCC */}
      <span className="w-full flex flex-row justify-between items-center pr-2">
        <div className="flex pt-0.5">
          {/* Input */}
          <div
            className={classNames(
              "w-[64px] flex-shrink-0 text-slate-500 dark:text-zinc-400 sm:text-sm col-span-2 flex items-center whitespace-nowrap",
              alignLabels === "left" ? "justify-start" : "justify-end"
            )}
          >
            {toProps.text || "To"}
          </div>
          <SelectorField
            selectedEmail={selectedEmail}
            emails={toProps.emails}
            setEmails={toProps.setEmails}
            readOnly={readOnly}
          />
        </div>
        {!disableCC && (
          <div
            className="rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-500 dark:border-zinc-400"
            onClick={() => setCcExpanded(!ccExpanded)}
          >
            <ChevronDownIcon
              className={classNames(
                "w-5 h-5 dark:text-zinc-400 text-slate-500",
                ccExpanded ? "rotate-180" : ""
              )}
            />
          </div>
        )}
      </span>
      {ccExpanded && !disableCC && (
        <React.Fragment>
          <div className="flex pt-0.5">
            {/* Input */}
            <div
              className={classNames(
                "w-[64px]   flex-shrink-0 text-slate-500 dark:text-zinc-400 sm:text-sm col-span-2 flex items-center whitespace-nowrap",
                alignLabels === "left" ? "justify-start" : "justify-end"
              )}
            >
              Cc
            </div>
            <SelectorField
              selectedEmail={selectedEmail}
              emails={ccProps.emails}
              setEmails={ccProps.setEmails}
              readOnly={readOnly}
            />
          </div>

          <div className="flex pt-0.5">
            {/* Input */}
            <div
              className={classNames(
                "w-[64px] flex-shrink-0 text-slate-500 dark:text-zinc-400 sm:text-sm col-span-2 flex items-center whitespace-nowrap",
                alignLabels === "left" ? "justify-start" : "justify-end"
              )}
            >
              Bcc
            </div>
            <SelectorField
              selectedEmail={selectedEmail}
              emails={bccProps.emails}
              setEmails={bccProps.setEmails}
              readOnly={readOnly}
            />
          </div>
        </React.Fragment>
      )}
    </div>
  );
}
