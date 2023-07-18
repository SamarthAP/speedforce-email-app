interface ThreadFeedProps {
  selectedThread: string;
  setSelectedThread: (threadId: string) => void;
}
export function ThreadFeed({
  selectedThread,
  setSelectedThread,
}: ThreadFeedProps) {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center">
      Thread ID {selectedThread}
      <button
        onClick={() => setSelectedThread("")}
        className="bg-slate-400 rounded-md py-1 px-2 mr-2 text-white shadow-lg"
      >
        Go Back
      </button>
    </div>
  );
}
