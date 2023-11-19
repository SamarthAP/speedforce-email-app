import { useState } from "react";

interface TooltipData {
  showTooltip: boolean;
  coords: React.CSSProperties | undefined;
  message: string;
}

interface TooltipHook {
  tooltipData: TooltipData;
  handleMouseEnter: (
    event: React.MouseEvent<HTMLElement>,
    message: string
  ) => void;
  handleMouseLeave: () => void;
}

export const useTooltip = (): TooltipHook => {
  const [tooltipData, setTooltipData] = useState<TooltipData>({
    showTooltip: false,
    coords: undefined,
    message: "",
  });
  const [tooltipTimer, setTooltipTimer] = useState<NodeJS.Timeout | null>();

  const handleMouseEnter = (
    event: React.MouseEvent<HTMLElement>,
    message: string
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipData({
      showTooltip: true,
      coords: {
        left: `${rect.x + rect.width / 2}px`,
        top: `${rect.y + rect.height}px`,
      },
      message,
    });

    const tooltipTimer = setTimeout(() => {
      handleMouseLeave();
    }, 2000);

    setTooltipTimer(tooltipTimer);
  };

  const handleMouseLeave = () => {
    // Clear the timer to prevent automatic hiding if the user moves the mouse out before the timer fires
    if (tooltipTimer) {
      clearTimeout(tooltipTimer);
    }

    setTooltipData({
      ...tooltipData,
      showTooltip: false,
    });
  };

  return { tooltipData, handleMouseEnter, handleMouseLeave };
};
