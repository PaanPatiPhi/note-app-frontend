"use client";

import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { cn } from "@/lib/utils";

export type LoadingSize = "xs" | "sm" | "md" | "lg" | "xl" | "auto";

export interface LoadingProps {
  size?: LoadingSize | number;
  text?: string;
  className?: string;
  textClassName?: string;
  fullScreen?: boolean;
}

const sizeMap: Record<LoadingSize, string> = {
  xs: "w-5 h-5",
  sm: "w-8 h-8",
  md: "w-16 h-16",
  lg: "w-28 h-28",
  xl: "w-36 h-36",
  auto: "w-full h-full",
};

export default function LoadingAnimation({
  size = "auto",
  text,
  className,
  textClassName,
  fullScreen = false,
}: LoadingProps) {
  const isAuto = size === "auto";
  const isSmall = size === "xs";
  const sizeClass = typeof size === "string" ? sizeMap[size] ?? sizeMap.auto : "";
  const inlineStyle = typeof size === "number" ? { width: size, height: size } : undefined;

  return (
    <div
      className={cn(
        isSmall && !text
          ? "inline-flex items-center justify-center"
          : "flex flex-col items-center justify-center",
        isAuto && !fullScreen && "w-full h-full",
        fullScreen && "min-h-screen w-full bg-[#F0EFEB] p-4",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center shrink-0 overflow-hidden",
          fullScreen && isAuto ? "w-28 h-28" : sizeClass
        )}
        style={inlineStyle}
      >
        <DotLottieReact
          src="/animations/LoadingPencil1.json"
          loop
          autoplay
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      {text && (
        <p
          className={cn(
            "text-xs text-[#66737D] font-medium tracking-wide mt-2 text-center",
            textClassName
          )}
        >
          {text}
        </p>
      )}
    </div>
  );
}

export { LoadingAnimation, LoadingAnimation as Loading };