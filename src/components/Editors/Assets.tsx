interface IconProps {
  className?: string;
  fill?: string;
  secondaryFill?: string;
}

export function BoldIcon({ className, fill }: IconProps) {
  return (
    <svg
      className={className}
      fill={fill || "#000000"}
      viewBox="0 0 1920 1920"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M480.286 822.857h548.571c151.269 0 274.286-123.017 274.286-274.286 0-151.268-123.017-274.285-274.286-274.285H480.286v548.571Zm0 822.857H1166c151.269 0 274.286-123.017 274.286-274.285 0-151.269-123.017-274.286-274.286-274.286H480.286v548.571ZM1166 1920H206V0h822.857c302.537 0 548.572 246.034 548.572 548.571 0 134.263-48.549 257.418-128.778 352.732 159.223 96.137 265.92 270.994 265.92 470.126 0 302.537-246.034 548.571-548.571 548.571Z"
        fillRule="evenodd"
      />
    </svg>
  );
}

export function ItalicIcon({ className, fill }: IconProps) {
  return (
    <svg
      className={className}
      fill={fill || "#000000"}
      viewBox="0 0 1920 1920"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M754.429 0v274.423h235.885L647.457 1645.85H343V1920h822.994v-274.149H930.11l342.857-1371.428h304.32V0z"
        fillRule="evenodd"
      />
    </svg>
  );
}

export function UnderlineIcon({ className, fill }: IconProps) {
  return (
    <svg
      className={className}
      fill={fill || "#000000"}
      viewBox="0 0 1920 1920"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1714.571 1645.714V1920H206v-274.286h1508.571ZM480.286 0v822.857c0 227.246 184.183 411.429 411.428 411.429h137.143c227.246 0 411.429-184.183 411.429-411.429V0h274.285v822.857c0 378.789-307.062 685.714-685.714 685.714H891.714C513.063 1508.571 206 1201.646 206 822.857V0h274.286Z"
        fillRule="evenodd"
      />
    </svg>
  );
}

export function StrikeIcon({ className, fill }: IconProps) {
  return (
    <svg
      className={className}
      fill={fill || "#000000"}
      viewBox="0 0 1920 1920"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1471.2 1261.689c9.24 67.2 4.92 138.84-16.32 215.64-53.16 190.08-176.64 319.56-348 364.8-46.44 12.24-94.56 17.76-143.04 17.76-209.16 0-424.92-104.04-546.84-225.12l-52.44-56.04 175.68-163.68 49.2 52.92c98.76 97.92 303.48 182.16 456.24 142.08 89.28-23.64 147.48-87.96 177.96-196.92 16.56-60 17.16-109.44 3.12-151.44Zm-31.92-991.08-163.8 175.32c-105.12-98.16-319.2-176.16-469.8-134.76-85.8 23.28-141.6 82.08-170.64 179.76-54.48 183.24 66.72 252 377.76 345.48 71.04 21.36 133.56 40.68 183.96 65.28H1920v240H0v-240h561.72c-135.6-96.84-226.68-243.6-156.72-479.16 67.08-225.84 220.68-311.16 337.8-343.08 247.8-66.72 543.6 48.36 696.48 191.16Z"
        fillRule="evenodd"
      />
    </svg>
  );
}

export function UndoIcon({ className, fill }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.53033 3.46967C7.82322 3.76256 7.82322 4.23744 7.53033 4.53033L5.81066 6.25L15.0358 6.25C15.94 6.24999 16.6693 6.24998 17.2576 6.3033C17.864 6.35826 18.3938 6.47456 18.875 6.75241C19.4451 7.08154 19.9185 7.55492 20.2476 8.12499C20.5254 8.60624 20.6417 9.13604 20.6967 9.74239C20.75 10.3307 20.75 11.06 20.75 11.9643V12.0358C20.75 12.94 20.75 13.6693 20.6967 14.2576C20.6418 14.8639 20.5255 15.3937 20.2476 15.875C19.9185 16.4451 19.4451 16.9185 18.875 17.2476C18.3938 17.5254 17.864 17.6417 17.2576 17.6967C16.6693 17.75 15.94 17.75 15.0358 17.75H8.00001C7.58579 17.75 7.25001 17.4142 7.25001 17C7.25001 16.5858 7.58579 16.25 8.00001 16.25H15C15.9484 16.25 16.6096 16.2493 17.1222 16.2028C17.6245 16.1573 17.9101 16.0726 18.125 15.9486C18.4671 15.7511 18.7511 15.467 18.9486 15.125C19.0726 14.9101 19.1573 14.6245 19.2028 14.1222C19.2493 13.6096 19.25 12.9484 19.25 12C19.25 11.0516 19.2493 10.3904 19.2028 9.87779C19.1573 9.37548 19.0726 9.0899 18.9486 8.87499C18.7511 8.53295 18.467 8.24892 18.125 8.05144C17.9101 7.92737 17.6245 7.84271 17.1222 7.79718C16.6096 7.75072 15.9484 7.75 15 7.75H5.81066L7.53033 9.46967C7.82322 9.76256 7.82322 10.2374 7.53033 10.5303C7.23744 10.8232 6.76256 10.8232 6.46967 10.5303L3.46967 7.53033C3.17678 7.23744 3.17678 6.76256 3.46967 6.46967L6.46967 3.46967C6.76256 3.17678 7.23744 3.17678 7.53033 3.46967Z"
        className={className}
        fill={fill || "#000000"}
      />
    </svg>
  );
}

export function RedoIcon({ className, fill }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 7H9.00001C7.13077 7 6.19615 7 5.5 7.40193C5.04395 7.66523 4.66524 8.04394 4.40193 8.49999C4 9.19615 4 10.1308 4 12C4 13.8692 4 14.8038 4.40192 15.5C4.66523 15.9561 5.04394 16.3348 5.5 16.5981C6.19615 17 7.13077 17 9 17H16M20 7L17 4M20 7L17 10"
        stroke={fill || "#000000"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TextColorIcon({ className, fill, secondaryFill }: IconProps) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 52 52"
      enableBackground="new 0 0 52 52"
    >
      <path
        fill={fill || "#000000"}
        d="M10.4,36h4.1c0.6,0,1.2-0.5,1.4-1.1l3.2-8.9h13.4l3.5,8.9c0.2,0.6,0.8,1.1,1.4,1.1h4.1
	c0.7,0,1.2-0.7,0.9-1.3L30.4,5c-0.2-0.6-0.7-1-1.3-1H22c-0.6,0-1.2,0.4-1.4,1l-11,29.7C9.3,35.3,9.8,36,10.4,36z M25.1,10H26l4.3,10
	h-9L25.1,10z"
      />
      <path
        fill={secondaryFill || "#000000"}
        d="M48.5,42h-45C2.7,42,2,42.7,2,43.5v3C2,47.3,2.7,48,3.5,48h45c0.8,0,1.5-0.7,1.5-1.5v-3
	C50,42.7,49.3,42,48.5,42z"
      />
    </svg>
  );
}

export function HighlightColorIcon({
  className,
  fill,
  secondaryFill,
}: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" fill="white" fillOpacity="0.01" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M37 37C39.2091 37 41 35.2091 41 33C41 31.5272 39.6667 29.5272 37 27C34.3333 29.5272 33 31.5272 33 33C33 35.2091 34.7909 37 37 37Z"
        fill={fill || "#000000"}
      />
      <path
        d="M20.8535 5.50439L24.389 9.03993"
        stroke={fill || "#000000"}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M23.6818 8.33281L8.12549 23.8892L19.4392 35.2029L34.9955 19.6465L23.6818 8.33281Z"
        stroke={fill || "#000000"}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M12 20.0732L28.961 25.6496"
        stroke={fill || "#000000"}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M4 43H44"
        stroke={secondaryFill || "#000000"}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BulletListIcon({ className, fill }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 -4 28 28"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        id="Page-1"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g
          id="Icon-Set"
          transform="translate(-570.000000, -209.000000)"
          fill={fill || "#000000"}
        >
          <path
            d="M597,226 L579,226 C578.447,226 578,226.448 578,227 C578,227.553 578.447,228 579,228 L597,228 C597.553,228 598,227.553 598,227 C598,226.448 597.553,226 597,226 L597,226 Z M572,209 C570.896,209 570,209.896 570,211 C570,212.104 570.896,213 572,213 C573.104,213 574,212.104 574,211 C574,209.896 573.104,209 572,209 L572,209 Z M579,212 L597,212 C597.553,212 598,211.553 598,211 C598,210.447 597.553,210 597,210 L579,210 C578.447,210 578,210.447 578,211 C578,211.553 578.447,212 579,212 L579,212 Z M597,218 L579,218 C578.447,218 578,218.448 578,219 C578,219.553 578.447,220 579,220 L597,220 C597.553,220 598,219.553 598,219 C598,218.448 597.553,218 597,218 L597,218 Z M572,217 C570.896,217 570,217.896 570,219 C570,220.104 570.896,221 572,221 C573.104,221 574,220.104 574,219 C574,217.896 573.104,217 572,217 L572,217 Z M572,225 C570.896,225 570,225.896 570,227 C570,228.104 570.896,229 572,229 C573.104,229 574,228.104 574,227 C574,225.896 573.104,225 572,225 L572,225 Z"
            id="bullet-list"
          ></path>
        </g>
      </g>
    </svg>
  );
}

export function NumberedListIcon({ className, fill }: IconProps) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
    >
      <line
        fill="none"
        stroke={fill || "#000000"}
        strokeWidth="2"
        strokeMiterlimit="10"
        x1="11"
        y1="7"
        x2="28"
        y2="7"
      />
      <line
        fill="none"
        stroke={fill || "#000000"}
        strokeWidth="2"
        strokeMiterlimit="10"
        x1="11"
        y1="16"
        x2="28"
        y2="16"
      />
      <line
        fill="none"
        stroke={fill || "#000000"}
        strokeWidth="2"
        strokeMiterlimit="10"
        x1="11"
        y1="25"
        x2="28"
        y2="25"
      />
      <path
        fill="none"
        stroke={fill || "#000000"}
        strokeWidth="2"
        strokeMiterlimit="10"
        d="M5,15v-0.5C5,13.7,5.7,13,6.5,13h0
	C7.3,13,8,13.7,8,14.5v0c0,0.3-0.1,0.6-0.4,0.8L5,17.8V18h4"
      />
      <path
        fill="none"
        stroke={fill || "#000000"}
        strokeWidth="2"
        strokeMiterlimit="10"
        d="M4,27h2.5C7.3,27,8,26.3,8,25.5v0
	C8,24.7,7.3,24,6.5,24H6v-0.1l1-1.7V22H4"
      />
      <path
        fill="none"
        stroke={fill || "#000000"}
        strokeWidth="2"
        strokeMiterlimit="10"
        d="M7,10V4H6.4c0,0-0.9,1-2,1"
      />
    </svg>
  );
}
