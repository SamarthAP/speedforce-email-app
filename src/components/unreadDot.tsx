export default function UnreadDot() {
  return (
    <span className="relative flex h-[6px] w-[6px]">
      <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-sky-500"></span>
    </span>
  );
}
