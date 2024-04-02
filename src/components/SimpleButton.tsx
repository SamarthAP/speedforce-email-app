import { classNames } from "../lib/util";
import Spinner from "./Spinner";

interface SimpleButtonProps {
  onClick: (event: any) => void;
  disabled?: boolean;
  loading: boolean;
  text: string;
  width?: string;
  seeThrough?: boolean;
}

export default function SimpleButton(props: SimpleButtonProps) {
  return (
    <button
      onClick={props.onClick}
      disabled={props.loading || props.disabled}
      className={classNames(
        "justify-center items-center inline-flex",
        "mt-2 px-3 py-2",
        "rounded-md shadow-sm disabled:cursor-default",
        props.seeThrough
          ? "bg-transparent hover:bg-gray-300 dark:hover:bg-zinc-600 disabled:bg-transparent dark:disabled:bg-transparent"
          : "bg-slate-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 disabled:bg-gray-300 dark:disabled:bg-zinc-600",
        "text-xs font-semibold text-slate-600 dark:text-zinc-300",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600",
        props.width || ""
      )}
    >
      {props.loading ? <Spinner /> : props.text}
    </button>
  );
}
