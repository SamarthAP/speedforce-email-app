import React from "react";
import { Transition } from "@headlessui/react";

interface TooltipPopoverProps {
  coords: React.CSSProperties | undefined;
  message: string;
  showTooltip: boolean;
}

const TooltipPopover: React.FC<TooltipPopoverProps> = ({
  coords,
  message,
  showTooltip,
}) => {
  return (
    <Transition
      show={showTooltip}
      enter="transition-all duration-300 ease-out"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-all duration-100 ease-out"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div
        className={`
            absolute bg-slate-600 text-white text-xs px-2 py-1 mt-1 rounded-md whitespace-nowrap transform -translate-x-1/2 pointer-events-none 
            ${!showTooltip ? "opacity-0" : ""}
          `}
        style={{ ...coords }}
      >
        {message}
      </div>
    </Transition>
  );
};

export default TooltipPopover;
