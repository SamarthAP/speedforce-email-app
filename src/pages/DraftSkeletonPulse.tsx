export default function DraftSkeletonPulse() {
  return (
    <div className="w-full px-4 rounded-md mx-auto">
      <div className="flex flex-col animate-pulse h-full justify-center">
        <div className="flex flex-row items-center space-x-3">
          <div className="w-16 bg-slate-100 dark:bg-zinc-800 h-16 rounded-full"></div>
          <div className="flex flex-col space-y-3">
            <div className="w-60 bg-slate-100 dark:bg-zinc-800 h-6 rounded-md"></div>
            <div className="w-48 bg-slate-100 dark:bg-zinc-800 h-6 rounded-md"></div>
          </div>
        </div>
        <div className="w-[calc(40rem)] h-4 bg-slate-100 dark:bg-zinc-800 mt-8 rounded-md"></div>
        <div className="w-96 h-4 bg-slate-100 dark:bg-zinc-800 mt-2 rounded-md"></div>
        <div className="w-96 h-4 bg-slate-100 dark:bg-zinc-800 mt-2 rounded-md"></div>
        <div className="w-96 h-4 bg-slate-100 dark:bg-zinc-800 mt-2 rounded-md"></div>
      </div>
    </div>
  );
}
