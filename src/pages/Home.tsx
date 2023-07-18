import ThreadList from "../components/ThreadList";
import Sidebar from "../components/Sidebar";
import supabase from "../lib/supabase";
import { ISelectedEmail, db } from "../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { fullSyncGoogle, partialSyncGoogle } from "../lib/sync";
import Titlebar from "../components/Titlebar";

interface HomeProps {
  selectedEmail: ISelectedEmail;
}

export default function Home({ selectedEmail }: HomeProps) {
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

  return (
    <main className="h-screen w-screen flex flex-col">
      <Titlebar />
      <div className="flex h-full overflow-hidden">
        <Sidebar />
        <div className="w-full flex flex-col overflow-hidden">
          <h2 className="text-xl pl-8 font-light tracking-wide my-8">
            Important
          </h2>
          <div className="flex absolute bottom-0 right-0 m-8">
            <button
              type="button"
              className="bg-slate-400 rounded-md py-1 px-2 mr-2 text-white shadow-lg"
              onClick={() => void partialSyncGoogle(selectedEmail.email)}
            >
              Partial Sync Google
            </button>
            <button
              type="button"
              className="bg-slate-400 rounded-md py-1 px-2 text-white shadow-lg"
              onClick={() => void fullSyncGoogle(selectedEmail.email)}
            >
              Full Sync Google
            </button>
          </div>
          <ThreadList selectedEmail={selectedEmail} threads={threads} />
        </div>
      </div>
    </main>
  );
}
