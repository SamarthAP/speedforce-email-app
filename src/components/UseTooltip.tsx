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
    setTooltipData({
      showTooltip: true,
      coords: {
        left: `${rect.x + rect.width / 2}px`,
        top: `${rect.y + rect.height}px`,
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
