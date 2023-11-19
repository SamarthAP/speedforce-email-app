import { useState } from "react";
import Calendar from "../components/Calendars/Calendar";
import WeekCalendar from "../components/Calendars/WeekCalendar";
import Sidebar from "../components/Sidebar";
import { EventResource } from "../api/model/gcal.interface";
import { listPrimaryCalendarEvents } from "../api/gCal/events";
import { useEmailPageOutletContext } from "./_emailPage";
import { dLog } from "../lib/noProd";
import { classNames } from "../lib/util";
import Spinner from "../components/Spinner";

export default function WeekCalendarPage() {
  const { selectedEmail } = useEmailPageOutletContext();
  const [calendarEvents, setCalendarEvents] = useState<EventResource[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(false);

  const sortedCalendarEvents = calendarEvents.sort((a, b) => {
    return (
      new Date(a.start.dateTime).getTime() -
      new Date(b.start.dateTime).getTime()
    );
  });

  return (
    <>
      <Sidebar />
      <div className="grid grid-cols-2 w-full">
        <div className="py-4 px-8 h-full flex flex-col overflow-hidden">
          <div className="mb-2">
            <p className="text-black dark:text-white tracking-wide text-lg font-medium mb-1">
              Today&apos;s calendar events
            </p>

            <button
              className={classNames(
                "inline-flex items-center ",
                "rounded-md px-2 py-1",
                "ring-1 ring-inset",
                "text-xs font-medium",
                "text-xs text-slate-700 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-500/10 ring-slate-600/20 dark:ring-zinc-500/20"
              )}
              onClick={() => {
                setLoadingEvents(true);
                // 12 am of the current day
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);

                // end of the current day
                const endOfDay = new Date();
                endOfDay.setHours(23, 59, 59, 999);

                listPrimaryCalendarEvents(
                  selectedEmail.email,
                  startOfDay.toISOString(),
                  endOfDay.toISOString()
                )
                  .then((events) => {
                    if (events.error || !events.data) {
                      dLog("error fetching gcal events", events.error);
                    } else {
                      setCalendarEvents(events.data.items);
                    }
                  })
                  .catch((err) => {
                    dLog("caught error fetching gcal events", err);
                  })
                  .finally(() => {
                    setLoadingEvents(false);
                  });
              }}
            >
              {loadingEvents ? (
                <Spinner className="!text-black dark:!text-white" />
              ) : (
                "Load"
              )}
            </button>
          </div>
          <ol className="h-full overflow-auto">
            {sortedCalendarEvents.map((event) => (
              <CalendarEvent
                key={event.id}
                title={event.summary}
                startTime={new Date(event.start.dateTime).getTime()}
                endTime={new Date(event.end.dateTime).getTime()}
              />
            ))}
          </ol>
        </div>
        <div className="py-4 px-8 h-full">
          <Calendar />
        </div>
      </div>
    </>
  );
}

function CalendarEvent({
  title,
  startTime,
  endTime,
}: {
  title: string;
  startTime: number;
  endTime: number;
}) {
  return (
    <li className="flex py-6 text-black dark:text-white border-b border-slate-200 dark:border-zinc-700">
      <p className="flex-auto truncate text-sm">{title}</p>
      <p className="flex-none ml-2 text-sm">
        <time>
          {new Date(startTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>{" "}
        -{" "}
        <time>
          {new Date(endTime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </p>
    </li>
  );
}
