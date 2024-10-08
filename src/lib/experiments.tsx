import { useLiveQuery } from "dexie-react-hooks";
import { loadContacts } from "./sync";
import { db } from "./db";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { dLog } from "./noProd";

function cleanIndexedDb() {
  const request = window.indexedDB.deleteDatabase("SpeedforceDB");
  request.onsuccess = () => {
    dLog("Deleted database successfully");
    window.location.reload();
  };
  request.onerror = () => {
    dLog("Couldn't delete database");
  };
  request.onblocked = () => {
    dLog("Couldn't delete database due to the operation being blocked");
  };
}

interface TestSyncButtonsProps {
  folderId: string;
  gmailFetchQuery?: string;
  outlookFetchQuery?: string;
}

const TestSyncButtons = (props: TestSyncButtonsProps) => {
  const selectedEmail = useLiveQuery(() => {
    return db.selectedEmail.get(1);
  });

  const [dragging, setDragging] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);
  const offsetX = useRef(0);
  const offsetY = useRef(0);

  const handleDragStart = (event: any) => {
    event.preventDefault();
    if (divRef.current) {
      const rect = divRef.current.getBoundingClientRect();
      offsetX.current = event.clientX - rect.left;
      offsetY.current = event.clientY - rect.top;
      setDragging(true);
    }
  };

  const handleDrag = (event: any) => {
    if (dragging && divRef.current) {
      const x = event.clientX - offsetX.current;
      const y = event.clientY - offsetY.current;
      divRef.current.style.left = `${x}px`;
      divRef.current.style.top = `${y}px`;
    }
  };

  const handleDragEnd = () => {
    setDragging(false);
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleDrag);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDrag);
      window.addEventListener("touchend", handleDragEnd);
    } else {
      window.removeEventListener("mousemove", handleDrag);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDrag);
      window.removeEventListener("touchend", handleDragEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleDrag);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDrag);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [dragging, handleDrag]);

  if (!selectedEmail) {
    return <div>Loading Buttons</div>;
  }

  return (
    <div
      ref={divRef}
      draggable="false"
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      className="flex absolute m-8 right-0 bottom-0 cursor-move h-fit w-fit p-4 bg-[rgba(0,0,0,0.5)]"
    >
      <button
        type="button"
        className="bg-slate-400 dark:bg-zinc-700 rounded-md py-1 px-2 mr-2 text-white shadow-lg text-xs"
      >
        Partial Sync (Gmail only)
      </button>
      <button
        type="button"
        className="bg-slate-400 dark:bg-zinc-700 rounded-md py-1 px-2 mr-2 text-white shadow-lg text-xs"
        // onClick={() =>
        //   void fullSync(selectedEmail.email, selectedEmail.provider, {
        //     folderId: props.folderId,
        //     gmailQuery: props.gmailFetchQuery,
        //     outlookQuery: props.outlookFetchQuery,
        //   })
        // }
      >
        Full Sync
      </button>
      <button
        type="button"
        className="bg-slate-400 dark:bg-zinc-700 rounded-md py-1 px-2 mr-2 text-white shadow-lg text-xs"
        onClick={() => {
          async function save() {
            const messages = await db.messages.toArray();

            window.electron.ipcRenderer.sendMessage("save-messages", messages);
          }

          void save().then(
            () => toast.success("Saved messages to file"),
            () => toast.error("Failed to save messages to file")
          );
        }}
      >
        Save Messages
      </button>
      <button
        type="button"
        className="bg-slate-400 dark:bg-zinc-700 rounded-md py-1 px-2 mr-2 text-white shadow-lg text-xs"
        onClick={() => {
          void loadContacts(selectedEmail.email, selectedEmail.provider);
        }}
      >
        Load Contacts
      </button>
    </div>
  );
};

export { TestSyncButtons, cleanIndexedDb };
