"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

export function AnimationPreview({
  animationUrl,
  size = "md"
}: {
  animationUrl?: string | null;
  name: string;
  size?: "md" | "sm";
}) {
  const containerClass =
    size === "sm"
      ? "flex h-12 w-12 items-center justify-center bg-white"
      : "flex h-32 w-full items-center justify-center border-b border-neutral-200 bg-white";
  const lottieSize = size === "sm" ? "h-10 w-10" : "h-28 w-28";

  const [animationData, setAnimationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!animationUrl) {
      setAnimationData(null);
      return;
    }
    setError(null);
    fetch(animationUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((json) => {
        if (active) setAnimationData(json);
      })
      .catch(() => {
        if (active) {
          setAnimationData(null);
          setError("unavailable");
        }
      });
    return () => {
      active = false;
    };
  }, [animationUrl]);

  if (animationData) {
    return (
      <div className={containerClass}>
        <Lottie animationData={animationData} loop className={lottieSize} />
      </div>
    );
  }

  return (
    <div className="flex h-40 items-center justify-center border-b border-black bg-neutral-100 text-xs uppercase tracking-wide">
      {error ? "Animation unavailable" : "No animation"}
    </div>
  );
}


