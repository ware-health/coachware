"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

export function AnimationPreview({
  animationUrl
}: {
  animationUrl?: string | null;
  name: string;
}) {
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
      <div className="flex h-40 items-center justify-center border-b border-neutral-200 bg-white">
        <Lottie animationData={animationData} loop className="h-36 w-full" />
      </div>
    );
  }

  return (
    <div className="flex h-40 items-center justify-center border-b border-black bg-neutral-100 text-xs uppercase tracking-wide">
      {error ? "Animation unavailable" : "No animation"}
    </div>
  );
}


