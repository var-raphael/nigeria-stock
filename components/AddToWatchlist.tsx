"use client";

// components/AddToWatchlist.tsx
//
// Drop this anywhere you want an "Add to watchlist" button.
// It checks if the symbol is already on the watchlist on mount,
// then toggles it on click — optimistic UI + fire-and-forget API call.
//
// Usage:
//   <AddToWatchlist symbol="MTNN" />
//   <AddToWatchlist symbol="DANGCEM" size="sm" />

import { useState, useEffect } from "react";
import { HiOutlineBookmark, HiBookmark } from "react-icons/hi";

interface Props {
  symbol: string;
  /** "sm" = icon only pill, "md" = icon + label (default) */
  size?: "sm" | "md";
}

export default function AddToWatchlist({ symbol, size = "md" }: Props) {
  const [watching, setWatching]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [animating, setAnimating] = useState(false);

  // Check watchlist status on mount
  useEffect(() => {
    fetch("/api/watchlist")
      .then((r) => r.json())
      .then((d: { items: { symbol: string }[] }) => {
        setWatching(d.items.some((i) => i.symbol === symbol));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [symbol]);

  const toggle = async () => {
    if (loading) return;
    const next = !watching;
    setWatching(next);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);

    if (next) {
      await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      }).catch(() => setWatching(!next));
    } else {
      await fetch(`/api/watchlist?symbol=${symbol}`, { method: "DELETE" })
        .catch(() => setWatching(!next));
    }
  };

  const label = watching ? "Watching" : "Add to Watchlist";
  const color = watching ? "#2563eb" : undefined;

  if (size === "sm") {
    return (
      <button
        onClick={toggle}
        title={label}
        style={{
          width: 36, height: 36, borderRadius: 10,
          border: `1px solid ${watching ? "rgba(37,99,235,.3)" : "rgba(59,130,246,.15)"}`,
          background: watching ? "rgba(37,99,235,.08)" : "transparent",
          cursor: loading ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: color ?? "#7a95c0",
          transition: "all .18s ease",
          transform: animating ? "scale(1.2)" : "scale(1)",
          flexShrink: 0,
        }}
      >
        {watching
          ? <HiBookmark size={16} />
          : <HiOutlineBookmark size={16} />
        }
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "9px 16px", borderRadius: 12, cursor: loading ? "default" : "pointer",
        border: `1.5px solid ${watching ? "rgba(37,99,235,.4)" : "rgba(59,130,246,.2)"}`,
        background: watching ? "rgba(37,99,235,.08)" : "transparent",
        color: color ?? "#7a95c0",
        fontFamily: "'Syne',sans-serif", fontSize: ".8rem", fontWeight: 800,
        transition: "all .18s ease",
        transform: animating ? "scale(1.04)" : "scale(1)",
      }}
      onMouseEnter={(e) => {
        if (!watching) e.currentTarget.style.borderColor = "rgba(37,99,235,.4)";
      }}
      onMouseLeave={(e) => {
        if (!watching) e.currentTarget.style.borderColor = "rgba(59,130,246,.2)";
      }}
    >
      {watching
        ? <HiBookmark size={15} />
        : <HiOutlineBookmark size={15} />
      }
      {label}
    </button>
  );
}
