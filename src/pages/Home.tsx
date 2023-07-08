import ThreadList from "../components/ThreadList";
import Sidebar from "../components/Sidebar";
import supabase from "../lib/supabase";
import { getFullList, list } from "../api/gmail/users/threads";
import { db } from "../lib/db";

export default function Home() {
  async function logout() {
    const { error } = await supabase.auth.signOut();
    console.log(error);
  }

  // get the current email/provider selected and use that variable for various api calls

  return (
    <div className="h-screen w-screen flex">
      <Sidebar />
      <div className="w-full overflow-hidden">
        <h2 className="text-2xl pl-8 font-light tracking-wide my-8">
          Important
        </h2>
        <button
          type="button"
          className=""
          onClick={async () => {
            const { data, error } = await getFullList(
              "samarth@sigilinnovation.com"
            );

            const threads = data.threads.map((thread) => {
              return {
                id: thread.id,
                historyId: thread.historyId,
                email: "samarth@sigilinnovation.com",
                from: thread.messages[0].payload.headers.filter(
                  (header) => header.name === "From"
                )[0].value,
                subject: thread.messages[0].payload.headers.filter(
                  (header) => header.name === "Subject"
                )[0].value,
                snippet: thread.messages[0].snippet, // // this should be the latest message's snippet
                date: new Date(
                  thread.messages[0].payload.headers.filter(
                    (header) => header.name === "Date"
                  )[0].value
                ).getTime(),
              };
            });

            await db.googleThreads.bulkPut(threads);

            console.log(data);
            console.log(error);
          }}
        >
          list
        </button>
        <ThreadList />
      </div>
    </div>
  );
}
