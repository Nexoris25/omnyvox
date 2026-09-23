"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** Renders children at a true device width (so container queries pick the
 * right layout) and scales it down to fit the available space. */
export function ScaledPreview({
  width,
  children,
}: {
  width: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setScale(Math.min(1, entry.contentRect.width / width)),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);
  return (
    <div ref={ref} className="scaled-preview">
      <div className="scaled-preview-frame" style={{ width, zoom: scale }}>
        {children}
      </div>
      {scale < 1 && (
        <span className="scaled-preview-label">
          {width}px · shown at {Math.round(scale * 100)}%
        </span>
      )}
    </div>
  );
}
