import * as React from "react";
import { cn } from "@/lib/utils";

interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  trackColorClass?: string;
}

export function CircularProgress({
  value,
  size = 60,
  strokeWidth = 6,
  colorClass = "text-brand",
  trackColorClass = "text-muted",
  className,
  ...props
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg className="transform -rotate-90 w-full h-full">
        {/* Track */}
        <circle
          className={cn("transition-colors duration-200 ease-in-out fill-transparent", trackColorClass)}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress */}
        <circle
          className={cn("transition-all duration-500 ease-in-out fill-transparent", colorClass)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold">{value}</span>
      </div>
    </div>
  );
}
