import React from "react";

interface MapWithPinIconProps {
  size?: number;
  className?: string;
}

export const MapWithPinIcon: React.FunctionComponent<MapWithPinIconProps> = ({
  size = 56,
  className
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Folded map background */}
    <g>
      {/* Left panel - light beige */}
      <polygon points="4,18 22,12 22,54 4,48" fill="#f1efe7" />
      {/* Middle panel - green */}
      <polygon points="22,12 42,18 42,58 22,54" fill="#9bd29b" />
      {/* Right panel - light blue */}
      <polygon points="42,18 60,12 60,48 42,58" fill="#cfe7f3" />

      {/* Roads on middle panel */}
      <path
        d="M22,30 L42,34"
        stroke="#ffffff"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M28,12 L30,54"
        stroke="#ffffff"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Fold lines */}
      <line
        x1="22"
        y1="12"
        x2="22"
        y2="54"
        stroke="#b9b6ad"
        strokeWidth="0.6"
      />
      <line
        x1="42"
        y1="18"
        x2="42"
        y2="58"
        stroke="#b9b6ad"
        strokeWidth="0.6"
      />
    </g>

    {/* Red pin */}
    <g transform="translate(30,6)">
      <path
        d="M9,0 C4,0 0,4 0,9 C0,16 9,26 9,26 C9,26 18,16 18,9 C18,4 14,0 9,0 Z"
        fill="#e53935"
        stroke="#b71c1c"
        strokeWidth="0.8"
      />
      <circle cx="9" cy="9" r="3.2" fill="#ffffff" />
    </g>
  </svg>
);

export default MapWithPinIcon;
