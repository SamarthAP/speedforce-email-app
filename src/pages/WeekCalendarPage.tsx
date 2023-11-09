import WeekCalendar from "../components/Calendars/WeekCalendar";
import Sidebar from "../components/Sidebar";

export default function WeekCalendarPage() {
  return (
    <div className="flex w-full">
      <Sidebar />
      <div className="flex-1">
        <WeekCalendar />
      </div>
    </div>
  );
}
