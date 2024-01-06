import { Tab } from "@headlessui/react";
import DateSelectCalendar from "../components/Calendars/DateSelectCalendar";
import Titlebar from "../components/Titlebar";
import { ISelectedEmail, db } from "../lib/db";
import { classNames } from "../lib/util";
import React, { useState } from "react";
import { dLog } from "../lib/noProd";
import { useTooltip } from "../components/UseTooltip";
import TooltipPopover from "../components/TooltipPopover";

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
  const { tooltipData, handleMouseEnter, handleMouseLeave } = useTooltip(
    /*disableTimer=*/ true
  );

  return (
    <main className="h-screen w-screen flex flex-col items-center dark:bg-zinc-900">
      <Titlebar />
      <div className="max-w-sm w-full mt-4 text-sm">
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
              Welcome to Speedforce
              <br></br>
              <br></br>
              We’re here to help you manage your inbox more efficiently.
              <br></br>
              <br></br>
              <button
                className={classNames(
                  "inline-flex items-center float-right",
                  "rounded-md px-2 py-1",
                  "ring-1 ring-inset",
                  "text-xs font-medium",
                  "text-xs text-slate-700 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-500/10 ring-slate-600/20 dark:ring-zinc-500/20"
                )}
                onClick={() => {
                  setSelectedTabIndex(1);
                }}
              >
                Next
              </button>
            </Tab.Panel>
            <Tab.Panel className={panelStyles}>
              Speedforce is loaded with features that will help you get to{" "}
              <span
                onMouseEnter={(event: React.MouseEvent<HTMLElement>) => {
                  handleMouseEnter(
                    event,
                    "Inbox Zero is an approach to email management that focuses on keeping an inbox empty -- or almost empty -- at all times."
                  );
                }}
                onMouseLeave={() => {
                  handleMouseLeave();
                }}
                className="text-blue-600 underline-offset-4 underline cursor-pointer"
              >
                inbox zero.
              </span>
              <br></br>
              <br></br>
              And it all begins with a fresh start.
              <br></br>
              <br></br>
              <button
                className={classNames(
                  "inline-flex items-center float-right",
                  "rounded-md px-2 py-1",
                  "ring-1 ring-inset",
                  "text-xs font-medium",
                  "text-xs text-slate-700 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-500/10 ring-slate-600/20 dark:ring-zinc-500/20"
                )}
                onClick={() => {
                  setSelectedTabIndex(2);
                }}
              >
                Next
              </button>
            </Tab.Panel>
            <Tab.Panel className={panelStyles}>
              To help you achieve inbox zero, we offer you the flexibility to
              choose a starting point for your inbox.
              <br></br>
              <br></br>
              In the next step, you will select a date to start your inbox from.
              You will work towards maintaining inbox zero for emails from that
              date onwards.
              <br></br>
              <br></br>
              We won&apos;t delete any of your emails before your selected date.
              We&apos;ll just hide them from your inbox.
              <br></br>
              <br></br>
              <button
                className={classNames(
                  "inline-flex items-center float-right",
                  "rounded-md px-2 py-1",
                  "ring-1 ring-inset",
                  "text-xs font-medium",
                  "text-xs text-slate-700 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-500/10 ring-slate-600/20 dark:ring-zinc-500/20"
                )}
                onClick={() => {
                  setSelectedTabIndex(3);
                }}
              >
                Next
              </button>
            </Tab.Panel>
            <Tab.Panel className={panelStyles}>
              <div>Please select your inbox zero start date.</div>
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
                  db.emails
                    .update(selectedEmail.email, {
                      inboxZeroStartDate: selectedDate.getTime(),
                    })
                    .then(() => {
                      void db.selectedEmail.update(1, {
                        inboxZeroStartDate: selectedDate.getTime(),
                      });
                    })
                    .catch((e) => {
                      dLog(e);
                    });
                }}
              >
                Select {formatDate(selectedDate)}
              </button>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
      <TooltipPopover {...tooltipData} />
    </main>
  );
}
