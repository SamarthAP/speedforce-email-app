import { DEFAULT_KEYBINDS, KEYBOARD_ACTIONS } from "../lib/shortcuts";
import GoToPageHotkeys from "../components/KeyboardShortcuts/GoToPageHotkeys";
import ShortcutsFloater from "../components/KeyboardShortcuts/ShortcutsFloater";
import Titlebar from "../components/Titlebar";
import Sidebar from "../components/Sidebar";
import { classNames } from "../lib/util";
import { useNavigate } from "react-router-dom";
import QuickReplies from "../components/QuickReplies";
import { useQuery } from "react-query";
import { useEmailPageOutletContext } from "../pages/_emailPage";
import { listQuickReplies } from "../api/dashboard";

const tabs = [
  {
    title: "Quick Replies",
    href: "/",
  },
  {
    title: "Action Items",
    href: "/",
  },
  {
    title: "Catch Up",
    href: "/",
  },
];

export default function Dashboard() {
  const { selectedEmail } = useEmailPageOutletContext();
  const navigate = useNavigate();

  const { data: quickReplies } = useQuery(
    ["quickReplies", selectedEmail.email],
    async () => {
      const { data, error } = await listQuickReplies(selectedEmail.email);

      if (error) {
        return null;
      }

      console.log(data);
      return data;
    }
  );

  return (
    <GoToPageHotkeys>
      <div className="overflow-hidden h-screen w-screen flex flex-col">
        <Titlebar />
        <div className="w-full h-full flex overflow-hidden">
          <Sidebar />
          <div className="w-full h-full flex flex-col">
            <div className="flex flex-row items-center justify-between">
              <nav className="flex items-center pl-6">
                {tabs.map((tab) => (
                  <h2
                    key={tab.title}
                    onClick={() => navigate(tab.href)}
                    className={classNames(
                      "select-none mr-1 tracking-wide my-3 text-lg px-2 py-1 rounded-md cursor-pointer",
                      tab.title === "Quick Replies"
                        ? "font-medium text-black dark:text-white"
                        : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-zinc-500 dark:hover:text-slate-100 dark:hover:bg-zinc-700"
                    )}
                  >
                    {tab.title}
                  </h2>
                ))}
              </nav>
            </div>
            <QuickReplies suggestions={quickReplies} />
          </div>
        </div>
      </div>

      <ShortcutsFloater
        items={[
          {
            keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.MOVE_DOWN]],
            description: "Move Down",
          },
          {
            keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.MOVE_UP]],
            description: "Move Up",
          },
          {
            keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.STAR]],
            description: "Star",
          },
          {
            keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.SELECT]],
            description: "View Thread",
          },
          {
            keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.SEARCH]],
            description: "Search",
          },
          {
            keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.COMPOSE]],
            description: "Compose",
          },
          {
            keystrokes: [DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.GO_TO], "s"],
            isSequential: true,
            description: "Go to Starred",
          },
        ]}
      />
    </GoToPageHotkeys>
  );
}
