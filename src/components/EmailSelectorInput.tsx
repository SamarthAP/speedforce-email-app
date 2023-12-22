import { useState } from "react";
import { XCircleIcon } from "@heroicons/react/20/solid";
import { useLiveQuery } from "dexie-react-hooks";
import { IContact, db } from "../lib/db";
import { useEmailPageOutletContext } from "../pages/_emailPage";
import { Combobox } from "@headlessui/react";
import { classNames, delay } from "../lib/util";
import { string } from "zod";

interface EmailSelectorInputProps {
  text: string;
  emails: string[];
  setEmails: (emails: string[]) => void;
}

export function EmailSelectorInput({
  text,
  emails,
  setEmails,
}: EmailSelectorInputProps) {
  const [emailText, setEmailText] = useState("");
  const { selectedEmail } = useEmailPageOutletContext();
  const emailSchema = string().email({ message: "Invalid email" });

  // Check if email is valid and not already in the send list
  const isValidEmail = (email: string) => {
    try {
      emailSchema.parse(email); // If email is invalid, this will throw an error
      return !emails.includes(email);
    } catch (error) {
      return false;
    }
  };

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

  const onEmailKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "," || event.key === " ") {
      // Validate email and add to send list
      if (isValidEmail(emailText)) {
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

  const userContactsList = useLiveQuery(() => {
    return db.contacts.where("email").equals(selectedEmail.email).toArray();
  }, []);

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
              isValidEmail(contact.contactEmailAddress)
            );
          })
          .slice(0, 5);

  return (
    <div className="flex py-2">
      {/* Input */}
      <div className="w-[64px] flex-shrink-0 text-slate-500 dark:text-zinc-400 sm:text-sm col-span-2 flex items-center justify-end whitespace-nowrap">
        {text}
      </div>
      <div className="flex flex-row flex-wrap pl-10">
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

        <Combobox as="div" className="items-center" onChange={onSearchSelect}>
          {/* <div className="relative h-full items-center"> */}
          <Combobox.Input
            className="block h-full border-0 bg-transparent dark:text-white text-black focus:outline-none placeholder:text-slate-500 placeholder:dark:text-zinc-400 sm:text-sm sm:leading-6"
            placeholder="..."
            pattern=""
            value={emailText}
            onChange={(event) => void onEmailTextChange(event)}
            onKeyUp={onEmailKeyUp}
          />

          {filteredContacts.length > 0 && (
            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-[calc(screen/2)] overflow-y-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
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
                    <>
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
                    </>
                  )}
                </Combobox.Option>
              ))}
            </Combobox.Options>
          )}
          {/* </div> */}
        </Combobox>
      </div>
    </div>
  );
}
