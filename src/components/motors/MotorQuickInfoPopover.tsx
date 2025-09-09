"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  anchorEl: HTMLElement | null;     // the card element
  open: boolean;
  onClose: () => void;
  content: React.ReactNode;         // already-rendered spec list
  zIndex?: number;
};

export default function MotorQuickInfoPopover({ anchorEl, open, onClose, content, zIndex = 60 }: Props) {
  const [mounted, setMounted] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const onScroll = () => onClose();
    if (open) {
      window.addEventListener("keydown", onKey);
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open, onClose]);

  // Compute placement every open or when anchor moves
  const style = usePopoverPosition(anchorEl, boxRef, { zIndex });

  if (!mounted || !open) return null;
  return createPortal(
    <div
      ref={boxRef}
      role="tooltip"
      style={style as React.CSSProperties}
      className="pointer-events-auto max-w-[280px] rounded-xl border border-border bg-popover p-3 text-sm shadow-xl ring-1 ring-black/5 dark:border-border dark:bg-popover"
      onClick={(e)=>e.stopPropagation()}
    >
      {content}
    </div>,
    document.body
  );
}

function usePopoverPosition(
  anchorEl: HTMLElement | null,
  boxRef: React.MutableRefObject<HTMLDivElement | null>,
  opts: { zIndex: number }
) {
  const [style, setStyle] = useState<Record<string, number | string>>({ display: "none" });

  useLayoutEffect(() => {
    if (!anchorEl) return;
    const safeBottom = Number(getComputedStyle(document.documentElement).getPropertyValue("--safe-bottom") || 0);
    const rect = anchorEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Default: place above card; if not enough room, place below
    const boxWidth = Math.min(280, vw - 24);
    const margin = 8;
    const aboveY = rect.top - margin;
    const belowY = rect.bottom + margin;

    const placeAbove = aboveY >= 140; // need ~140px for content
    const top = placeAbove ? (rect.top - margin) : (belowY);
    let left = rect.left + rect.width / 2 - boxWidth / 2;

    // Clamp horizontally
    left = Math.max(12, Math.min(left, vw - boxWidth - 12));

    // If placing below, ensure we don't collide with sticky bar/safe area
    let finalTop = top;
    if (!placeAbove) {
      const stickyReserve = Math.max(12, safeBottom);
      if (finalTop + 160 > vh - stickyReserve) {
        finalTop = Math.max(12, vh - stickyReserve - 160);
      }
    }

    setStyle({
      position: "fixed",
      top: Math.round(finalTop),
      left: Math.round(left),
      width: boxWidth,
      zIndex: opts.zIndex,
      display: "block",
    });
  }, [anchorEl, openDeps(anchorEl)]); // eslint-disable-line

  return style;
}

// small helper to recalc when anchor moves size/pos
function openDeps(el: HTMLElement | null) {
  if (!el) return 0;
  const r = el.getBoundingClientRect();
  return `${r.x},${r.y},${r.width},${r.height},${window.innerWidth},${window.innerHeight}`;
}