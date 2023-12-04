import { Tab } from "@headlessui/react";
import DateSelectCalendar from "../components/Calendars/DateSelectCalendar";
import Titlebar from "../components/Titlebar";
import { ISelectedEmail, db } from "../lib/db";
import { classNames } from "../lib/util";
import { useState } from "react";
import { dLog } from "../lib/noProd";

const panelStyles = classNames(
  "rounded-lg px-2 py-2 text-center dark:text-white",
  "focus:outline-none",
  "fadeIn-animation"
);
const tabs = ["Step 1", "Step 2", "Step 3", "Step 4"];
function formatDate(date: Date) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const day = date.getDate().toString().padStart(2, "0");
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
}

interface InboxZeroSetupPageProps {
  selectedEmail: ISelectedEmail;
}

export default function InboxZeroSetup({
  selectedEmail,
}: InboxZeroSetupPageProps) {
  const [selectedTabIndex, setSelectedTabIndex] = useState<number>(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <main className="h-screen w-screen flex flex-col items-center dark:bg-zinc-900">
      <Titlebar />
      <div className="something max-w-sm w-full mt-4 text-sm">
        <Tab.Group
          selectedIndex={selectedTabIndex}
          onChange={setSelectedTabIndex}
        >
          <Tab.List
            className={
              "flex space-x-1 rounded-lg bg-slate-200 dark:bg-zinc-700 p-1"
            }
          >
            {tabs.map((tab) => (
              <Tab
                key={tab}
                className={({ selected }) => {
                  return classNames(
                    "w-full rounded-md py-0.5 text-xs font-medium leading-5",
                    "focus:outline-none",
                    selected
                      ? "bg-white dark:bg-zinc-900 text-black dark:text-white shadow"
                      : "text-slate-700 dark:text-zinc-200 hover:bg-slate-300 dark:hover:bg-zinc-600"
                  );
                }}
              >
                {tab}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel className={panelStyles}>
              <p>Let&apos;s set something up before we visit your inbox.</p>
            </Tab.Panel>
            <Tab.Panel className={panelStyles}>
              Inbox Zero is our feature designed to help you manage your emails
              more efficiently by aiming to keep your inbox as empty as
              possible.
            </Tab.Panel>
            <Tab.Panel className={panelStyles}>
              To help you achieve Inbox Zero, we offer you the flexibility to
              choose a starting point.
              <br></br>
              <br></br>
              This means you can decide how far back in time you want to start
              managing your emails towards Inbox Zero.
              <br></br>
              <br></br>
              Please select your inbox zero start date on the calendar in Step
              4.
            </Tab.Panel>
            <Tab.Panel className={panelStyles}>
              <div className="mb-4 mt-2">
                <DateSelectCalendar
                  selectedDate={selectedDate}
                  currentDate={currentDate}
                  setSelectedDate={setSelectedDate}
                  setCurrentDate={setCurrentDate}
                />
              </div>

              <button
                className={classNames(
                  "inline-flex items-center ",
                  "rounded-md px-2 py-1",
                  "ring-1 ring-inset",
                  "text-xs font-medium",
                  "text-xs text-slate-700 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-500/10 ring-slate-600/20 dark:ring-zinc-500/20"
                )}
                onClick={() => {
                  // get 12 am for selected date
                  selectedDate.setHours(0, 0, 0, 0);
                  db.inboxZeroMetadata
                    .put({
                      email: selectedEmail.email,
                      inboxZeroStartDate: selectedDate.getTime(),
                    })
                    .then()
                    .catch((e) => {
                      dLog(e);
                    });
                }}
              >
                Choose {formatDate(selectedDate)}
              </button>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </main>
  );
}
