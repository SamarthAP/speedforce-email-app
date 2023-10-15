import React from "react";
import clsx from "clsx";
import { Transition } from "@headlessui/react";

interface TooltipPopoverProps {
  coords: React.CSSProperties | undefined;
  message: string;
  showTooltip: boolean;
}

const TooltipPopover: React.FC<TooltipPopoverProps> = ({ coords, message, showTooltip }) => {
  return (
    <Transition
          show={showTooltip}
          enter="transition-all duration-1000 ease-out"
          enterFrom=" opacity-0"
          enterTo=" opacity-100"
          leave="transition-all duration-1000 ease-out"
          leaveFrom=" opacity-100"
          leaveTo=" opacity-0"
    >
      <div
        className={clsx(
          "absolute bg-slate-600 text-white text-xs px-2 py-1 mt-1 rounded-md whitespace-nowrap",
          "top-full left-1/2 transform -translate-x-1/2 pointer-events-none z-50"
          
        )}
        style={{ ...coords }}
      >
        
        {message}
         
      </div>
    </Transition>
  );
};

export default TooltipPopover;

// import React, { useState } from "react";
// import clsx from "clsx";

// interface TooltipProps {
  // coords: React.CSSProperties | undefined;
  // message: string;
  // showTooltip: boolean;
// }

// const TooltipPopover: React.FC<TooltipProps> = ({ coords, message, showTooltip }) => {
//   return (
    // <div
    //   className={clsx(
    //     "absolute bg-slate-600 text-white text-xs px-2 py-1 mt-1 rounded-md whitespace-nowrap",
    //     showTooltip ? "opacity-100" : "opacity-0",
    //     "top-full left-1/2 transform -translate-x-1/2 transition-opacity duration-300 ease-in-out pointer-events-none z-50"
    //   )}
    //   style={{ ...coords }}
    // >
    //   {message}
    // </div>
//   );
// };
