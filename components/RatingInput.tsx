"use client";

import { useState } from "react";

interface RatingInputProps {
  trackId: string;
  currentRating: number | null;
  onRated: (rating: number) => void;
}

export default function RatingInput({
  trackId,
  currentRating,
  onRated,
}: RatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRate = async (rating: number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId, rating }),
      });
      if (res.ok) {
        onRated(rating);
      }
    } finally {
      setLoading(false);
    }
  };

  const display = hovered ?? currentRating;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            disabled={loading}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleRate(n)}
            className={`w-7 h-7 rounded text-xs font-bold transition-all duration-100 ${
              display !== null && n <= display
                ? "bg-spotify-green text-black"
                : "bg-white/10 text-white/50 hover:bg-white/20"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {n}
          </button>
        ))}
      </div>
      {currentRating !== null && (
        <p className="text-xs text-white/40">Jouw score: {currentRating}/10</p>
      )}
    </div>
  );
}
