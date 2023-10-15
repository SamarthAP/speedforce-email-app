import React, { useEffect } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: React.ReactNode;
}

const Portal: React.FC<PortalProps> = ({ children }) => {
  const mount = document.getElementById("portal-root");
  const elem = document.createElement("div");

  useEffect(() => {
    if (mount) {
      mount.appendChild(elem);
    }
    return () => {
      if (mount) {
        mount.removeChild(elem);
      }
    };
  }, [elem, mount]);

  return mount ? createPortal(children, elem) : null;
};

export default Portal;
