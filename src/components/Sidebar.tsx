import {
  ClipboardDocumentIcon,
  ClockIcon,
  ExclamationCircleIcon,
  InboxIcon,
  PaperAirplaneIcon,
  TrashIcon,
  StarIcon,
  ArchiveBoxIcon,
  CalendarIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

import { useNavigate } from "react-router-dom";
import TooltipPopover from "./TooltipPopover";
import { useTooltip } from "./UseTooltip";
import { classNames } from "../lib/util";
import { useLDClient } from "launchdarkly-react-client-sdk";
import { useInboxZeroBackgroundContext } from "../contexts/InboxZeroBackgroundContext";

const navigation = [
  { name: "Inbox", href: "/", icon: InboxIcon, current: false },
  { name: "Calendar", href: "/calendar", icon: CalendarIcon, current: false },
  { name: "Starred", href: "/starred", icon: StarIcon, current: false },
  { name: "Sent", href: "/sent", icon: PaperAirplaneIcon, current: false },
  {
    name: "Drafts",
    href: "/drafts",
    icon: ClipboardDocumentIcon,
    current: false,
  },
  { name: "Done", href: "/done", icon: ArchiveBoxIcon, current: false },
  { name: "Spam", href: "/spam", icon: ExclamationCircleIcon, current: false },
  { name: "Deleted Items", href: "/deleted", icon: TrashIcon, current: false },
  // { name: "Scheduled", href: "#", icon: ClockIcon, current: false },
  // { name: "Settings", href: "/settings", icon: Cog6ToothIcon, current: false },
  // {
  //   name: "Add Account",
  //   href: "/page/addAccount",
  //   icon: PlusIcon,
  //   current: false,
  // },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { tooltipData, handleShowTooltip, handleHideTooltip } = useTooltip();
  const ldClient = useLDClient();
  const { isBackgroundOn } = useInboxZeroBackgroundContext();

  return (
    <div className="h-full w-20 pt-2 px-2 flex flex-col flex-shrink-0 overflow-y-scroll hide-scroll items-center space-y-1">
      {navigation.map((item) => {
        if (
          item.name !== "Calendar" ||
          (ldClient?.allFlags()["calendar"] === true &&
            item.name === "Calendar")
        ) {
          return (
            <div
              key={item.name}
              onMouseEnter={(event) => {
                handleShowTooltip(
                  event,
                  item.name == "Deleted Items" ? "Deleted" : item.name
                );
              }}
              onMouseLeave={() => {
                handleHideTooltip();
              }}
              onClick={() => navigate(item.href)}
              className={
                isBackgroundOn
                  ? classNames(
                      "flex rounded-md p-3 text-sm leading-6 font-semibold cursor-pointer",
                      "text-white hover:bg-black/50"
                    )
                  : classNames(
                      item.current
                        ? "bg-slate-100 dark:bg-zinc-800"
                        : "hover:bg-slate-100 dark:hover:bg-zinc-800",
                      "flex rounded-md p-3 text-sm leading-6 font-semibold cursor-pointer",
                      "text-slate-600 dark:text-zinc-300"
                    )
              }
            >
              <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
            </div>
          );
        }
      })}

      <TooltipPopover
        message={tooltipData.message}
        showTooltip={tooltipData.showTooltip}
        coords={tooltipData.coords}
      />
    </div>
  );
}
// <div className="h-screen w-[200px] min-w-[256px] bg-slate-300 text-white flex flex-col items-center justify-center">
//   <div>hello</div>
// <button
//   type="button"
//   onClick={() => navigate("/addAccount")}
//   className="bg-slate-500 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded"
// >
//   Go to Add Account
// </button>
// </div>
