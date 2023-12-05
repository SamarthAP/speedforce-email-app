import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { classNames } from "../../lib/util";

export interface CalendarDate {
  date: string;
  dateObject: Date;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
}

export interface DateSelectCalendarProps {
  currentDate: Date;
  selectedDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
}

export default function DateSelectCalendar({
  currentDate,
  selectedDate,
  setCurrentDate,
  setSelectedDate,
}: DateSelectCalendarProps) {
  function offsetMonth(offset: number) {
    setCurrentDate((currentDate) => {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() + offset);
      return date;
    });
  }

  const allowedDates = getPast7DaysIncludingToday();

  return (
    <div className="text-center col-start-8 col-end-13 row-start-1">
      <div className="flex items-center text-gray-900">
        <button
          onClick={() => offsetMonth(-1)}
          type="button"
          className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-slate-500 dark:text-zinc-400 hover:text-slate-400 dark:hover:text-zinc-500"
        >
          <span className="sr-only">Previous month</span>
          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex-auto text-sm text-slate-500 dark:text-zinc-400">
          {currentDate.toLocaleString("default", { month: "long" })}{" "}
          {currentDate.getFullYear()}
        </div>
        <button
          onClick={() => offsetMonth(1)}
          type="button"
          className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-slate-500 dark:text-zinc-400 hover:text-slate-400 dark:hover:text-zinc-500"
        >
          <span className="sr-only">Next month</span>
          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-7 text-xs leading-6 text-slate-500 dark:text-zinc-400">
        <div>M</div>
        <div>T</div>
        <div>W</div>
        <div>T</div>
        <div>F</div>
        <div>S</div>
        <div>S</div>
      </div>
      <div className="isolate mt-2 grid grid-cols-7 gap-px rounded-lg bg-slate-200 dark:bg-zinc-700 text-sm shadow ring-1 ring-slate-200 dark:ring-zinc-700">
        {getCalendarDates(currentDate, selectedDate).map(
          (day, dayIdx, days) => (
            <button
              key={dayIdx}
              type="button"
              disabled={!allowedDates.has(dateToDayMonthYear(day.dateObject))}
              onClick={() => {
                setSelectedDate(day.dateObject);
              }}
              className={classNames(
                "py-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 focus:z-10 text-xs",
                day.isCurrentMonth
                  ? "bg-white dark:bg-black"
                  : "bg-slate-50 dark:bg-zinc-950",
                day.isSelected || day.isToday ? "font-semibold" : "",
                day.isSelected ? "text-white dark:text-black" : "",
                !day.isSelected && day.isCurrentMonth && !day.isToday
                  ? "text-black dark:text-white"
                  : "",
                !day.isSelected && !day.isCurrentMonth && !day.isToday
                  ? "text-slate-400 dark:text-zinc-500"
                  : "",
                day.isToday && !day.isSelected ? "" : "",
                dayIdx === 0 ? "rounded-tl-lg" : "",
                dayIdx === 6 ? "rounded-tr-lg" : "",
                dayIdx === days.length - 7 ? "rounded-bl-lg" : "",
                dayIdx === days.length - 1 ? "rounded-br-lg" : "",
                allowedDates.has(dateToDayMonthYear(day.dateObject))
                  ? "!bg-emerald-200 dark:!bg-emerald-900"
                  : "cursor-not-allowed"
              )}
            >
              <time
                dateTime={day.date}
                className={classNames(
                  "mx-auto flex h-7 w-7 items-center justify-center rounded-full",
                  !day.isSelected && day.isToday
                    ? "bg-slate-300 dark:bg-zinc-600"
                    : "",
                  day.isSelected && day.isToday
                    ? "bg-slate-900 dark:bg-zinc-100"
                    : "",
                  day.isSelected && !day.isToday
                    ? "bg-slate-900 dark:bg-zinc-100"
                    : ""
                )}
              >
                {day.date.split("-").pop()?.replace(/^0/, "")}
              </time>
            </button>
          )
        )}
      </div>
    </div>
  );
}

function getCalendarDates(date: Date, selectedDate: Date): CalendarDate[] {
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
      date: date.toISOString().slice(0, 10),
      dateObject: date,
      isCurrentMonth: false,
      isSelected: checkSameDayMonthYear(date, selectedDate),
      isToday: false,
    });
  }

  // Add days in the month
  for (let i = 0; i < daysInMonth; i++) {
    const date = new Date(year, month, i + 1);
    dates.push({
      date: date.toISOString().slice(0, 10),
      dateObject: date,
      isCurrentMonth: true,
      isSelected: checkSameDayMonthYear(date, selectedDate),
      isToday: date.toDateString() === new Date().toDateString(),
    });
  }

  // Add days after the month
  for (let i = 0; i < daysAfterMonth; i++) {
    const date = new Date(year, month + 1, i + 1);
    dates.push({
      date: date.toISOString().slice(0, 10),
      dateObject: date,
      isCurrentMonth: false,
      isSelected: checkSameDayMonthYear(date, selectedDate),
      isToday: false,
    });
  }

  return dates;
}

function getPast7DaysIncludingToday(): Set<string> {
  const dates = new Set<string>();

  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.add(dateToDayMonthYear(date));
  }

  return dates;
}

function checkSameDayMonthYear(date1: Date, date2: Date) {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

function dateToDayMonthYear(date: Date) {
  return `${date.getDate()}/${date.getMonth()}/${date.getFullYear()}`;
}
