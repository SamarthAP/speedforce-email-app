import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { classNames } from "../lib/util";
import { useState } from "react";

export interface CalendarDate {
  date: string;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  // const [days, setDays] = useState<CalendarDate[]>([]);

  function offsetMonth(offset: number) {
    setCurrentDate((currentDate) => {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() + offset);
      return date;
    });
  }

  return (
    <div className="text-center col-start-8 col-end-13 row-start-1">
      <div className="flex items-center text-gray-900">
        <button
          onClick={() => offsetMonth(-1)}
          type="button"
          className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-slate-500 dark:text-zinc-500 hover:text-slate-400 dark:hover:text-zinc-400"
        >
          <span className="sr-only">Previous month</span>
          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex-auto text-sm font-semibold">
          {currentDate.toLocaleString("default", { month: "long" })}
        </div>
        <button
          onClick={() => offsetMonth(1)}
          type="button"
          className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-slate-500 dark:text-zinc-500 hover:text-slate-400 dark:hover:text-zinc-400"
        >
          <span className="sr-only">Next month</span>
          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-6 grid grid-cols-7 text-xs leading-6 text-gray-500">
        <div>M</div>
        <div>T</div>
        <div>W</div>
        <div>T</div>
        <div>F</div>
        <div>S</div>
        <div>S</div>
      </div>
      <div className="isolate mt-2 grid grid-cols-7 gap-px rounded-lg bg-gray-200 text-sm shadow ring-1 ring-gray-200">
        {getCalendarDates(currentDate).map((day, dayIdx, days) => (
          <button
            key={dayIdx}
            type="button"
            className={classNames(
              "py-1.5 hover:bg-gray-100 focus:z-10 text-xs",
              day.isCurrentMonth ? "bg-white" : "bg-gray-50",
              day.isSelected || day.isToday ? "font-semibold" : "",
              day.isSelected ? "text-white" : "",
              !day.isSelected && day.isCurrentMonth && !day.isToday
                ? "text-gray-900"
                : "",
              !day.isSelected && !day.isCurrentMonth && !day.isToday
                ? "text-gray-400"
                : "",
              day.isToday && !day.isSelected ? "text-indigo-600" : "",
              dayIdx === 0 ? "rounded-tl-lg" : "",
              dayIdx === 6 ? "rounded-tr-lg" : "",
              dayIdx === days.length - 7 ? "rounded-bl-lg" : "",
              dayIdx === days.length - 1 ? "rounded-br-lg" : ""
            )}
          >
            <time
              dateTime={day.date}
              className={classNames(
                "mx-auto flex h-7 w-7 items-center justify-center rounded-full",
                day.isSelected && day.isToday ? "bg-indigo-600" : "",
                day.isSelected && !day.isToday ? "bg-gray-900" : ""
              )}
            >
              {day.date.split("-").pop()?.replace(/^0/, "")}
            </time>
          </button>
        ))}
      </div>
    </div>
  );
}

function getCalendarDates(date: Date): CalendarDate[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = 1; // Monday
  const daysInMonth = lastDayOfMonth.getDate();
  const daysBeforeMonth = (firstDayOfMonth.getDay() - firstDayOfWeek + 7) % 7;
  const daysAfterMonth = (42 - daysInMonth - daysBeforeMonth) % 7;

  const dates = [];

  // Add days before the month
  for (let i = 0; i < daysBeforeMonth; i++) {
    const date = new Date(
      year,
      month,
      1 - firstDayOfMonth.getDay() + firstDayOfWeek + i
    );
    dates.push({
      date: date.toISOString().substr(0, 10),
      isCurrentMonth: false,
      isSelected: false,
      isToday: false,
    });
  }

  // Add days in the month
  for (let i = 0; i < daysInMonth; i++) {
    const date = new Date(year, month, i + 1);
    dates.push({
      date: date.toISOString().substr(0, 10),
      isCurrentMonth: true,
      isSelected: false,
      isToday: date.toDateString() === new Date().toDateString(),
    });
  }

  // Add days after the month
  for (let i = 0; i < daysAfterMonth; i++) {
    const date = new Date(year, month + 1, i + 1);
    dates.push({
      date: date.toISOString().substr(0, 10),
      isCurrentMonth: false,
      isSelected: false,
      isToday: false,
    });
  }

  return dates;
}
