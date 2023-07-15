import UnreadDot from "./UnreadDot";
import { IGoogleThread } from "../lib/db";
import he from "he";

function isToday(date: Date) {
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isLastSevenDaysButNotToday(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setHours(0, 0, 0, 0);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return date < today && date >= sevenDaysAgo;
}

function isOlderThanSevenDays(date: Date) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setHours(0, 0, 0, 0);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return date < sevenDaysAgo;
}

interface ThreadListProps {
  threads?: IGoogleThread[]; // TODO: change for outlook thread
}

export default function ThreadList({ threads }: ThreadListProps) {
  return (
    <div className="h-full overflow-y-scroll">
      <div className="flex flex-col w-full">
        {threads?.map((thread, index) => {
          return (
            <div key={index}>
              {index === 0 && isToday(new Date(thread.date)) ? (
                <div className="pl-8 text-sm text-slate-400 mb-2">Today</div>
              ) : null}

              {index === 0 &&
              isLastSevenDaysButNotToday(new Date(thread.date)) ? (
                <div className="pl-8 text-sm text-slate-400 mb-2">
                  Last 7 days
                </div>
              ) : null}

              {index > 0 &&
              isLastSevenDaysButNotToday(new Date(thread.date)) &&
              isToday(new Date(threads[index - 1].date)) ? (
                <div className="pl-8 text-sm text-slate-400 my-2">
                  Last 7 days
                </div>
              ) : null}

              {index === 0 && isOlderThanSevenDays(new Date(thread.date)) ? (
                <div className="pl-8 text-sm text-slate-400 mb-2">
                  Past Month And Older
                </div>
              ) : null}

              {index > 0 &&
              isOlderThanSevenDays(new Date(thread.date)) &&
              isLastSevenDaysButNotToday(new Date(threads[index - 1].date)) ? (
                <div className="pl-8 text-sm text-slate-400 my-2">
                  Past Month And Older
                </div>
              ) : null}

              <div className="grid grid-cols-10 py-1 pl-8 hover:bg-slate-100 cursor-default">
                <div className="text-sm flex items-center font-medium pr-4 col-span-2">
                  <div className="pr-2">
                    {thread.unread ? (
                      <UnreadDot />
                    ) : (
                      <div className="h-[6px] w-[6px]"></div>
                    )}
                  </div>

                  <span className="truncate">
                    {thread.from.slice(0, thread.from.lastIndexOf("<"))}
                  </span>
                </div>
                <div className="col-span-8 grid grid-cols-10">
                  <div className="text-sm truncate pr-4 col-span-2">
                    {thread.subject}
                  </div>
                  <div className="col-span-8 flex">
                    <div className="text-sm truncate text-zinc-400 w-full">
                      {/* {he.decode(
                        thread.snippet.slice(0, thread.snippet.indexOf("\n"))
                      )} */}
                      {he.decode(thread.snippet)}
                    </div>
                    {/* flex-shrink-0 is the class keeping the text from not expanding the height of the row */}
                    <div className="text-sm pl-2 pr-4 flex-shrink-0 text-zinc-400 font-medium">
                      {new Date(thread.date).toDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
