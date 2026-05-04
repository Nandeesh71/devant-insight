import { useId } from "react";

export const FolderIcon3D = ({ size = 44 }: { size?: number }) => {
  const uid = useId().replace(/:/g, "");
  const bodyId = `folderBody-${uid}`;
  const shineId = `folderShine-${uid}`;
  const shadowId = `folderShadow-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={bodyId} x1="40" y1="20" x2="40" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e8956d" />
          <stop offset="62%" stopColor="#e8873a" />
          <stop offset="100%" stopColor="#d57230" />
        </linearGradient>
        <linearGradient id={shineId} x1="40" y1="20" x2="40" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f5b880" stopOpacity="0.6" />
          <stop offset="60%" stopColor="#e07830" stopOpacity="0" />
        </linearGradient>
        <filter id={shadowId} x="0" y="10" width="80" height="58" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#c4622a" floodOpacity="0.35" />
        </filter>
      </defs>

      <path
        d="M8 18C8 15 10 13 13 13H28C31 13 33 15 33 18V22H8V18Z"
        fill="#b85c2a"
      />

      <g filter={`url(#${shadowId})`}>
        <rect x="4" y="20" width="72" height="44" rx="7" ry="7" fill={`url(#${bodyId})`} />
      </g>

      <rect x="4" y="20" width="72" height="44" rx="7" ry="7" fill={`url(#${shineId})`} />
      <rect x="4" y="56" width="72" height="8" rx="0" ry="0" fill="#c4622a" opacity="0.4" />
    </svg>
  );
};
