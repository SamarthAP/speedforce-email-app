import { useState } from 'react';

interface TooltipData {
  showTooltip: boolean;
  coords: React.CSSProperties | undefined;
  message: string;
}

interface TooltipHook {
  tooltipData: TooltipData;
  handleMouseEnter: (event: React.MouseEvent<HTMLElement>, message: string) => void;
  handleMouseLeave: () => void;
}

export const useTooltip = (): TooltipHook => {
  const [tooltipData, setTooltipData] = useState<TooltipData>({
    showTooltip: false,
    coords: undefined,
    message: "",
  });

  const handleMouseEnter = (event: React.MouseEvent<HTMLElement>, message: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
  
    const tooltip = document.createElement("div");
    tooltip.textContent = message;
    tooltip.style.position = "absolute";
    tooltip.style.visibility = "hidden";
    document.body.appendChild(tooltip);
  
    const tooltipWidth = tooltip.clientWidth;
    const tooltipHeight = tooltip.clientHeight;
  
    document.body.removeChild(tooltip);
  
    let left = rect.x + rect.width / 2;
    let top = rect.y + rect.height;
  
    if (left + tooltipWidth / 2 > windowWidth) {
      left = windowWidth - tooltipWidth / 2;
    } else if (left - tooltipWidth / 2 < 0) {
      left = tooltipWidth / 2;
    }
  
    if (top + tooltipHeight > windowHeight) {
      top = rect.y - tooltipHeight;
    }
  
    setTooltipData({
      showTooltip: true,
      coords: {
        left: `${left}px`,
        top: `${top}px`,
      },
      message,
    });
  };

  const handleMouseLeave = () => {
    setTooltipData({
      ...tooltipData,
      showTooltip: false,
    });
  };

  return { tooltipData, handleMouseEnter, handleMouseLeave };
};
