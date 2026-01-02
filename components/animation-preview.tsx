"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

// Global cache for animation data to prevent duplicate fetches
const animationCache = new Map<string, any>();
const loadingPromises = new Map<string, Promise<any>>();
const errorCache = new Set<string>();

export function AnimationPreview({
  animationUrl,
  size = "md"
}: {
  animationUrl?: string | null;
  name: string;
  size?: "md" | "sm" | "xs";
}) {
  const containerClass =
    size === "xs"
      ? "flex h-8 w-8 items-center justify-center bg-white overflow-hidden"
      : size === "sm"
      ? "flex h-12 w-12 items-center justify-center bg-white overflow-hidden"
      : "flex h-32 w-full items-center justify-center bg-white overflow-hidden";
  const lottieSize = size === "xs" ? "h-8 w-8" : size === "sm" ? "h-10 w-10" : "h-28 w-28";

  const [animationData, setAnimationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!animationUrl) {
      setAnimationData(null);
      setError(null);
      return;
    }

    // Check cache first
    if (animationCache.has(animationUrl)) {
      setAnimationData(animationCache.get(animationUrl));
      setError(null);
      return;
    }

    // Check if already loading
    if (loadingPromises.has(animationUrl)) {
      loadingPromises.get(animationUrl)!.then((data) => {
        if (active) {
          setAnimationData(data);
          setError(null);
        }
      }).catch(() => {
        if (active) {
          setAnimationData(null);
          setError("unavailable");
        }
      });
      return;
    }

    // Check error cache
    if (errorCache.has(animationUrl)) {
      setAnimationData(null);
      setError("unavailable");
      return;
    }

    // Fetch animation
    setError(null);
    const fetchPromise = fetch(animationUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((json) => {
        // Cache the result
        animationCache.set(animationUrl, json);
        loadingPromises.delete(animationUrl);
        if (active) {
          setAnimationData(json);
          setError(null);
        }
        return json;
      })
      .catch((err) => {
        errorCache.add(animationUrl);
        loadingPromises.delete(animationUrl);
        if (active) {
          setAnimationData(null);
          setError("unavailable");
        }
        throw err;
      });

    loadingPromises.set(animationUrl, fetchPromise);

    return () => {
      active = false;
    };
  }, [animationUrl]);

  if (animationData) {
    return (
      <div className={containerClass}>
        <div className={lottieSize + " overflow-hidden"}>
          <Lottie animationData={animationData} loop className="h-full w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-40 items-center justify-center border-b border-black bg-neutral-100 text-xs uppercase tracking-wide">
      {error ? "Animation unavailable" : "No animation"}
    </div>
  );
}


