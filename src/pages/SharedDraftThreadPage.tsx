import { ISelectedEmail } from "../lib/db";
import Titlebar from "../components/Titlebar";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { ArrowSmallLeftIcon } from "@heroicons/react/20/solid";
import { useQuery } from "react-query";
import { EmailSelectorInput } from "../components/EmailSelectorInput";
import ShadowDom from "../components/ShadowDom";
import { getSharedDraft } from "../api/sharedDrafts";

interface SharedDraftThreadPageProps {
  selectedEmail: ISelectedEmail;
}

export default function SharedDraftThreadPage({
  selectedEmail,
}: SharedDraftThreadPageProps) {
  const navigate = useNavigate();
  const { draftId } = useParams();

  const { data, isLoading } = useQuery("sharedDraft", async () => {
    if (!draftId) return;

    const { data, error } = await getSharedDraft(draftId, selectedEmail.email);
    if (error) {
      return null;
    }

    return data;
  });

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        navigate(-1);
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [navigate]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col dark:bg-zinc-900">
      <Titlebar />
      <div className="w-full h-full flex overflow-hidden">
        {/* <Sidebar /> */}
        <div className="w-full h-full flex flex-col overflow-hidden">
          <div className="flex px-4 pt-4">
            <div
              className="flex flex-row cursor-pointer items-center"
              onClick={(e) => {
                e.stopPropagation();
                navigate(-1);
              }}
            >
              <ArrowSmallLeftIcon className="h-4 w-4 dark:text-zinc-400 text-slate-500" />
              <p className="dark:text-zinc-400 text-slate-500 text-xs px-1">
                Back
              </p>
            </div>
          </div>
          {isLoading ? (
            <div className="w-full h-full flex justify-center items-center">
              <svg
                className="animate-spin h-10 w-10 text-slate-500 dark:text-zinc-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A8.003 8.003 0 0112 4.472v3.09a4 4 0 100 7.296v3.09A7.96 7.96 0 016 17.291z"
                ></path>
              </svg>
            </div>
          ) : (
            <div className="py-4 px-12 w-full">
              {/* subject of email */}
              <h1 className="text-xl mb-4 font-semibold text-slate-900 dark:text-zinc-200">
                {data?.subject}
              </h1>

              {/* email recipients */}
              <EmailSelectorInput
                selectedEmail={selectedEmail}
                alignLabels="left"
                readOnly
                toProps={{
                  text: "To",
                  emails: data?.recipients || [],
                }}
                ccProps={{
                  text: "Cc",
                  emails: data?.cc || [],
                }}
                bccProps={{
                  text: "Bcc",
                  emails: data?.bcc || [],
                }}
              />

              {/* email body */}
              <div className="py-4">
                {data.html_data ? (
                  <ShadowDom htmlString={data.html_data} showImages={true} />
                ) : (
                  <p className="text-slate-500 dark:text-zinc-500">
                    No message body
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        {/* <SelectedThreadBar
          thread={threadId || ""}
          email={selectedEmail.email}
        /> */}
      </div>
    </div>
  );
}
