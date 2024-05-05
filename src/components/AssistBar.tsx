import { db } from "../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import Feedback from "./Feedback";
import toast from "react-hot-toast";
import { dLog } from "../lib/noProd";
import { useInboxZeroBackgroundContext } from "../contexts/InboxZeroBackgroundContext";
import { useNavigate } from "react-router-dom";
import { useEmailPageOutletContext } from "../pages/_emailPage";
import { useTooltip } from "./UseTooltip";
import TooltipPopover from "./TooltipPopover";

export default function AssistBar() {
  const { isBackgroundOn } = useInboxZeroBackgroundContext();
  const { selectedEmail } = useEmailPageOutletContext();
  const { tooltipData, handleShowTooltip, handleHideTooltip } = useTooltip();
  const navigate = useNavigate();

  const actionItems = useLiveQuery(
    () =>
      db.actionItems
        .where("email")
        .equals(selectedEmail.email)
        .and((item) => !item.completed)
        .toArray(),
    [selectedEmail.email]
  );

  // Note: this is just to set a custom inboxzero start date
  // useEffect(() => {
  //   void db.selectedEmail.update(selectedEmail.id, {
  //     inboxZeroStartDate: dayjs("2024-02-20").toDate().getTime(),
  //   });
  // }, []);

  if (isBackgroundOn) {
    return null;
  }

  return (
    <>
      <div className="flex-shrink-0 flex flex-col gap-y-2 w-64 h-full hide-scroll overflow-y-scroll p-4 border-l border-l-slate-200 dark:border-l-zinc-700 break-words">
        <p className="mb-2 text-sm font-bold text-slate-500 dark:text-zinc-400">
          Action Items
        </p>
        <div className="flex flex-col gap-y-2 h-full overflow-y-scroll">
          {actionItems?.map((item, index) => {
            return (
              <div
                key={index}
                className={`text-xs text-slate-500 dark:text-zinc-400 flex gap-x-4 items-center`}
              >
                <button
                  onMouseEnter={(event) => {
                    handleShowTooltip(event, "Mark as completed");
                  }}
                  onMouseLeave={handleHideTooltip}
                  onClick={() => {
                    db.actionItems
                      .update(item.threadId, {
                        completed: true,
                      })
                      .then(() => {
                        toast("Action item completed");
                      })
                      .catch((error) => {
                        dLog("Failed to update action item", error);
                      });
                  }}
                  className="h-3 w-3 rounded-sm flex-shrink-0 bg-slate-50 dark:bg-zinc-500/10 ring-1 ring-inset ring-slate-600/20 dark:ring-zinc-500/20"
                ></button>
                <p
                  onClick={() => void navigate(`/thread/${item.threadId}`)}
                  className="w-full cursor-pointer hover:underline underline-offset-2"
                >
                  {item.actionItemString}
                </p>
              </div>
            );
          })}
        </div>

        <div className="fixed bottom-12 right-0 h-18 w-6 rounded-l-md bg-slate-600 dark:bg-zinc-200 shrink-0">
          <Feedback />
        </div>

        {/* <Calendar /> */}
      </div>
      <TooltipPopover
        message={tooltipData.message}
        showTooltip={tooltipData.showTooltip}
        coords={tooltipData.coords}
      />
    </>
  );
}
