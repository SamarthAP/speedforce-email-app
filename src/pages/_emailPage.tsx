import { Outlet, useOutletContext } from "react-router-dom";
import Titlebar from "../components/Titlebar";
import { ISelectedEmail, db } from "../lib/db";
import { useState } from "react";
import { InboxZeroBackgroundContext } from "../contexts/InboxZeroBackgroundContext";
import { useLiveQuery } from "dexie-react-hooks";

interface OutletContext {
  selectedEmail: ISelectedEmail;
}

interface EmailPageProps {
  selectedEmail: ISelectedEmail;
}

export default function EmailPage({ selectedEmail }: EmailPageProps) {
  const [isBackgroundOn, setIsBackgroundOn] = useState(false);
  const dailyImageMetadata = useLiveQuery(() => db.dailyImageMetadata.get(1));
  const backgroundImageUrl = dailyImageMetadata ? dailyImageMetadata.url : "";

  return (
    <main className="h-screen w-screen flex flex-col dark:bg-zinc-900">
      <div
        className={`h-screen w-screen fadeIn-animation bg-cover bg-center`}
        style={
          isBackgroundOn && backgroundImageUrl
            ? {
                backgroundImage: "url(" + backgroundImageUrl + ")",
              }
            : {
                backgroundColor: "transparent",
              }
        }
      >
        {isBackgroundOn && (
          <>
            <div className="absolute h-[100px] w-screen inset-0 bg-gradient-to-b from-black/50 to-transparent pointer-events-none"></div>
            <div className="absolute h-[50px] w-screen bottom-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
            <div className="absolute h-screen w-[90px] left-0 inset-0 bg-gradient-to-r from-black/50 to-transparent pointer-events-none"></div>
            <div className="absolute z-10 bottom-4 left-1/2 -translate-x-1/2 text-white/75 text-sm font-medium">
              Congrats! You&apos;ve reached Inbox Zero{" "}
              <span
                className="text-transparent"
                style={{
                  textShadow: "0 0 0 rgb(255 255 255 / 0.75)",
                }}
              >
                🔥
              </span>
            </div>
          </>
        )}
        <InboxZeroBackgroundContext.Provider
          value={{
            isBackgroundOn,
            setIsBackgroundOn,
          }}
        >
          <Titlebar />
          <div className="flex h-full overflow-hidden">
            <Outlet context={{ selectedEmail }} />
          </div>
        </InboxZeroBackgroundContext.Provider>
      </div>
    </main>
  );
}

// so that you can use `const {selectedEmail} = useEmailPageOutletContext()`
// in the child components (rendered by the Outlet)
export function useEmailPageOutletContext() {
  return useOutletContext<OutletContext>();
}
