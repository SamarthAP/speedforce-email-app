import ThreadList from "../components/ThreadList";
import Sidebar from "../components/Sidebar";
import supabase from "../lib/supabase";
import { db } from "../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import React, { useEffect } from "react";
import { useEmailPageOutletContext } from "./_emailPage";
import { ThreadFeed } from "./ThreadFeed";
import { partialSyncGoogle, fullSyncGoogle } from "../lib/sync";

export default function Home() {
  const { selectedEmail } = useEmailPageOutletContext();
  const [selectedThread, setSelectedThread] = React.useState<string>("");
  const [scrollPosition, setScrollPosition] = React.useState<number>(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const divVisibleHeight = scrollRef.current.clientHeight;
      const divScrollHeight = scrollRef.current.scrollHeight;
      const maxScroll = divScrollHeight - divVisibleHeight;

      if (scrollPosition > maxScroll) {
        setScrollPosition(maxScroll);
      }

      scrollRef.current.scrollTo(0, scrollPosition);
    }
  }, [selectedThread, scrollPosition]);

  const threads = useLiveQuery(() => {
    return db.googleThreads
      .where("email")
      .equals(selectedEmail.email)
      .reverse()
      .sortBy("date");
  });

  async function logout() {
    const { error } = await supabase.auth.signOut();
    console.log(error);
  }

  if (selectedThread) {
    return (
      <ThreadFeed
        selectedThread={selectedThread}
        setSelectedThread={setSelectedThread}
      />
    );
  }

  return (
    <React.Fragment>
      <Sidebar />
      <div className="w-full flex flex-col overflow-hidden">
        <h2 className="text-xl pl-8 font-light tracking-wide my-8 text-black dark:text-white">
          Important
        </h2>
        <div className="flex absolute bottom-0 right-0 m-8">
          <button
            type="button"
            className="bg-slate-400 dark:bg-zinc-700 rounded-md py-1 px-2 mr-2 text-white shadow-lg"
            onClick={() => void partialSyncGoogle(selectedEmail.email)}
          >
            Partial Sync Google
          </button>
          <button
            type="button"
            className="bg-slate-400 dark:bg-zinc-700 rounded-md py-1 px-2 text-white shadow-lg"
            onClick={() => void fullSyncGoogle(selectedEmail.email)}
          >
            Full Sync Google
          </button>
        </div>
        <ThreadList
          selectedEmail={selectedEmail}
          threads={threads}
          setSelectedThread={setSelectedThread}
          setScrollPosition={setScrollPosition}
          scrollRef={scrollRef}
        />
      </div>
    </React.Fragment>
  );
}
