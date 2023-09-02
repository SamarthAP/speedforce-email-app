import ThreadList from "../components/ThreadList";
import Sidebar from "../components/Sidebar";
import { IEmail, IEmailThread, db } from "../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import React, { useEffect, useRef, useState } from "react";
import { useEmailPageOutletContext } from "../pages/_emailPage";
import { ThreadFeed } from "../components/ThreadFeed";
import AssistBar from "../components/AssistBar";
import { TestSyncButtons } from "../lib/experiments";
import { UserCircleIcon, CheckIcon } from "@heroicons/react/24/outline";
import { Menu } from "@headlessui/react";
import { fullSync } from "../lib/sync";

interface ThreadViewProps {
  folderId: string;
  title: string;
}

export default function ThreadView(props: ThreadViewProps) {
  const { selectedEmail } = useEmailPageOutletContext();
  const [hoveredThread, setHoveredThread] = useState<IEmailThread | null>(null);
  const [selectedThread, setSelectedThread] = useState<string>("");
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    const emailThreads = db.emailThreads
      .where("email")
      .equals(selectedEmail.email)
      .and((thread) => thread.folderId === props.folderId || selectedEmail.provider === "google")
      .reverse()
      .sortBy("date");

    return emailThreads;
  }, [selectedEmail]);

  // useEffect(() => {
  //   if(!threads){
  //     fullSync(selectedEmail.email, selectedEmail.provider, { folderId: props.folderId })
  //   }
  // }, [selectedEmail, props.folderId]);


  const signedInEmails = useLiveQuery(() => {
    return db.emails.orderBy("email").toArray();
  });

  if (selectedThread) {
    return (
      <React.Fragment>
        <ThreadFeed
          selectedThread={selectedThread}
          setSelectedThread={setSelectedThread}
        />
        <AssistBar thread={hoveredThread} />
      </React.Fragment>
    );
  }

  const setSelectedEmail = async (email: IEmail) => {
    await db.selectedEmail.put({
      id: 1,
      email: email.email,
      provider: email.provider,
    });
  };

  return (
    <React.Fragment>
      <Sidebar />
      <div className="w-full flex flex-col overflow-hidden">
        <div className="flex flex-row items-center justify-between">
          <h2 className="text-xl pl-8 font-light tracking-wide my-4 text-black dark:text-white">
            {props.title}
          </h2>
          <div className="relative">
            <Menu>
              <Menu.Button>
                <UserCircleIcon className="h-6 w-6 mr-3 shrink-0 text-black dark:text-white" />
              </Menu.Button>
              <Menu.Items className="absolute right-0 top-8">
                {signedInEmails?.map((email) => (
                  <Menu.Item key={email.email}>
                    {({ active }) => (
                      <div
                        className="px-3 py-2 bg-gray-300 hover:bg-gray-400 flex flex-row justify-between items-center"
                        key={email.email}
                        onClick={() => void setSelectedEmail(email)}
                      >
                        <div className="text-md">{email.email}</div>
                        {email.email === selectedEmail.email && (
                          <CheckIcon className="h-4 w-4 shrink-0 text-black" />
                        )}
                      </div>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Menu>
          </div>
        </div>
        <TestSyncButtons folderId={props.folderId}/>
        <ThreadList
          selectedEmail={selectedEmail}
          threads={threads}
          setSelectedThread={setSelectedThread}
          setHoveredThread={setHoveredThread}
          setScrollPosition={setScrollPosition}
          scrollRef={scrollRef}
        />
      </div>
      <AssistBar thread={hoveredThread} />
    </React.Fragment>
  );
}