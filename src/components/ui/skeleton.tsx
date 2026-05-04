import { cn } from "@/lib/utils";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: "light" | "dark";
};

function Skeleton({ className, tone = "light", style, ...props }: SkeletonProps) {
  const palette = tone === "dark"
    ? { base: "#2a2040", shine: "#3d3060" }
    : { base: "#f0edf8", shine: "#faf9ff" };

  return (
    <div
      className={cn("rounded-md", className)}
      style={{
        backgroundImage: `linear-gradient(90deg, ${palette.base} 25%, ${palette.shine} 37%, ${palette.base} 63%)`,
        backgroundSize: "200% 100%",
        animation: "shimmer 1.25s ease-in-out infinite",
        ...style,
      }}
      {...props}
    />
  );
}

export { Skeleton };
