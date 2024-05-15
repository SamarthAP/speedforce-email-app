import Sidebar from "../Sidebar";
import Titlebar from "../Titlebar";
import { classNames, getTemplateSnippet, isToday } from "../../lib/util";
import { IEmail, IEmailTemplate, db } from "../../lib/db";
import { useTooltip } from "../UseTooltip";
import { useNavigate } from "react-router-dom";
import AccountActionsMenu from "../AccountActionsMenu";
import AssistBar from "../AssistBar";
import { useHotkeys } from "react-hotkeys-hook";
import { DEFAULT_KEYBINDS, KEYBOARD_ACTIONS } from "../../lib/shortcuts";
import { useEmailPageOutletContext } from "../../pages/_emailPage";
import { useLiveQuery } from "dexie-react-hooks";
import { PlusIcon, TrashIcon } from "@heroicons/react/20/solid";
import TooltipPopover from "../TooltipPopover";
import { handleCreateDraft } from "../../lib/asyncHelpers";
import { DraftReplyType } from "../../api/model/users.draft";
import { dLog } from "../../lib/noProd";
import toast from "react-hot-toast";

export default function TemplatesThreadView() {
  const { selectedEmail } = useEmailPageOutletContext();
  const { tooltipData, handleShowTooltip, handleHideTooltip } = useTooltip();
  const navigate = useNavigate();

  const templates = useLiveQuery(() => {
    return db.emailTemplates
      .where("email")
      .equals(selectedEmail.email)
      .reverse()
      .sortBy("createdAt");
  });

  useHotkeys(DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.COMPOSE], () => {
    navigate("/compose");
  });

  useHotkeys(DEFAULT_KEYBINDS[KEYBOARD_ACTIONS.SEARCH], () => {
    navigate("/search");
  });

  const setSelectedEmail = async (email: IEmail) => {
    await db.selectedEmail.put({
      id: 1,
      email: email.email,
      provider: email.provider,
      inboxZeroStartDate: email.inboxZeroStartDate,
    });
  };

  const handleCreateEmailFromTemplate = async (template: IEmailTemplate) => {
    const { data, error } = await handleCreateDraft(
      selectedEmail.email,
      selectedEmail.provider,
      template.to.split(","),
      template.cc.split(","),
      template.bcc.split(","),
      template.subject,
      template.html,
      null,
      DraftReplyType.STANDALONE,
      null
    );

    if (error) {
      dLog(error);
    } else {
      navigate(`/draft/${data}`);
    }
  };

  const handleDeleteTemplate = async (template: IEmailTemplate) => {
    await db.emailTemplates
      .where("[name+email]")
      .equals([template.name, template.email])
      .delete();

    toast.success("Template deleted");
  };

  return (
    <div className="h-screen w-screen flex flex-col dark:bg-zinc-900">
      <Titlebar />
      <div className="h-full flex">
        <Sidebar />
        <div className="w-full h-full flex flex-col">
          <div className="flex flex-row items-center justify-between">
            <nav className="flex items-center pl-6">
              <h2
                className={classNames(
                  "select-none mr-1 tracking-wide my-3 text-lg px-2 py-1 rounded-md cursor-pointer",
                  "font-medium text-black dark:text-white"
                )}
              >
                Templates
              </h2>
            </nav>
            <div className="flex items-center">
              <AccountActionsMenu
                selectedEmail={selectedEmail}
                setSelectedEmail={(email) => void setSelectedEmail(email)}
                handleShowtooltip={handleShowTooltip}
                handleHideTooltip={handleHideTooltip}
              />
            </div>
          </div>
          <div className="w-full">
            {templates && templates.length > 0 ? (
              templates.map((template) => (
                <div
                  key={template.createdAt}
                  className={
                    "flex flex-row items-center justify-between border-b border-gray-200 dark:border-gray-700 py-1.5 px-4 hover:bg-slate-100 dark:hover:bg-zinc-800 group cursor-pointer"
                  }
                >
                  <div className="flex flex-col">
                    <div className="text-sm font-semibold text-black dark:text-white">
                      {template.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {getTemplateSnippet(template)}
                    </div>
                  </div>
                  <div className="text-sm flex-shrink-0 text-slate-400 dark:text-zinc-500 font-medium flex flex-col justify-center">
                    <span className="group-hover:hidden block">
                      {isToday(new Date(template.createdAt))
                        ? new Date(template.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : new Date(template.createdAt).toDateString()}
                    </span>

                    <span className="flex flex-row gap-x-1">
                      <button
                        onMouseEnter={(event) => {
                          handleShowTooltip(
                            event,
                            "Create Email from Template"
                          );
                        }}
                        onMouseLeave={handleHideTooltip}
                        onClick={(
                          event: React.MouseEvent<HTMLButtonElement, MouseEvent>
                        ) => {
                          event.stopPropagation();
                          void handleCreateEmailFromTemplate(template);
                        }}
                        className="ml-1 group-hover:block hidden dark:hover:[&>*]:!text-white hover:[&>*]:!text-black"
                      >
                        <PlusIcon className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                      </button>
                      <button
                        onMouseEnter={(event) => {
                          handleShowTooltip(event, "Discard Template");
                        }}
                        onMouseLeave={handleHideTooltip}
                        onClick={(
                          event: React.MouseEvent<HTMLButtonElement, MouseEvent>
                        ) => {
                          event.stopPropagation();
                          void handleDeleteTemplate(template);
                        }}
                        className="ml-1 group-hover:block hidden dark:hover:[&>*]:!text-white hover:[&>*]:!text-black"
                      >
                        <TrashIcon className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                      </button>
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-1/2">
                <p className="text-slate-400 dark:text-zinc-500 text-sm italic pl-8">
                  Looks like you don&apos;t have any templates saved. Create a
                  new template from a draft to import it.
                </p>
              </div>
            )}
          </div>
        </div>
        <AssistBar />
      </div>
      <TooltipPopover
        message={tooltipData.message}
        showTooltip={tooltipData.showTooltip}
        coords={tooltipData.coords}
      />
    </div>
  );
}
