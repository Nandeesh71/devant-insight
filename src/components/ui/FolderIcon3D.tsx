import { useId } from "react";

export const FolderIcon3D = ({ size = 48 }: { size?: number }) => {
  const uid = useId().replace(/:/g, "");
  const bodyId = `folderBody-${uid}`;
  const faceId = `folderFace-${uid}`;
  const shadowId = `folderShadow-${uid}`;
  const tabId = `folderTab-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={bodyId} x1="60" y1="20" x2="60" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e8956d" />
          <stop offset="64%" stopColor="#e8873a" />
          <stop offset="100%" stopColor="#c4622a" />
        </linearGradient>
        <linearGradient id={faceId} x1="14" y1="30" x2="106" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ef9c6f" stopOpacity="0.52" />
          <stop offset="52%" stopColor="#e8873a" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#c4622a" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id={tabId} x1="43" y1="10" x2="43" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c88464" />
          <stop offset="100%" stopColor="#b85c2a" />
        </linearGradient>
        <filter id={shadowId} x="6" y="16" width="108" height="68" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#c4622a" floodOpacity="0.34" />
        </filter>
      </defs>

      <rect x="30" y="10" width="36" height="18" rx="8" fill={`url(#${tabId})`} />

      <g filter={`url(#${shadowId})`}>
        <rect x="10" y="22" width="100" height="54" rx="12" fill={`url(#${bodyId})`} />
      </g>

      <rect x="10" y="22" width="100" height="54" rx="12" fill={`url(#${faceId})`} />
      <rect x="10" y="66" width="100" height="10" rx="0" fill="#c05820" opacity="0.26" />
    </svg>
  );
};
