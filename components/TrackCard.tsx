"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import RatingInput from "./RatingInput";
import { formatDuration } from "@/lib/spotify";

interface UserRating {
  rating: number;
  displayName: string;
}

interface TrackCardProps {
  track: {
    id: string;
    name: string;
    artists: { name: string }[];
    album: {
      name: string;
      images: { url: string }[];
    };
    duration_ms: number;
    external_urls: { spotify: string };
  };
  addedBy: string;
  average: number | null;
  count: number;
  users: Record<string, UserRating>;
  currentUserId: string;
}

export default function TrackCard({
  track,
  addedBy,
  average,
  count,
  users,
  currentUserId,
}: TrackCardProps) {
  const [localAverage, setLocalAverage] = useState(average);
  const [localCount, setLocalCount] = useState(count);
  const [localUsers, setLocalUsers] = useState(users);
  const [myRating, setMyRating] = useState(
    users[currentUserId]?.rating ?? null
  );

  const albumImage = track.album.images[0]?.url;

  const handleRated = useCallback(
    async (rating: number) => {
      setMyRating(rating);
      // Refresh rating data from server
      const res = await fetch(`/api/ratings?trackId=${track.id}`);
      if (res.ok) {
        const data = await res.json();
        setLocalAverage(data.average);
        setLocalCount(data.count);
        setLocalUsers(data.users);
      }
    },
    [track.id]
  );

  const scoreColor =
    localAverage === null
      ? "text-white/30"
      : localAverage >= 7
      ? "text-spotify-green"
      : localAverage >= 5
      ? "text-yellow-400"
      : "text-red-400";

  return (
    <div className="bg-white/5 hover:bg-white/8 transition-colors rounded-xl p-4 flex gap-4 border border-white/5">
      {/* Album Art */}
      <div className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-white/10">
        {albumImage ? (
          <Image
            src={albumImage}
            alt={track.album.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 text-2xl">
            ♪
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <a
          href={track.external_urls.spotify}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-white hover:text-spotify-green transition-colors truncate block"
        >
          {track.name}
        </a>
        <p className="text-sm text-white/60 truncate">
          {track.artists.map((a) => a.name).join(", ")}
        </p>
        <p className="text-xs text-white/30 mt-0.5">
          {formatDuration(track.duration_ms)} · Toegevoegd door {addedBy}
        </p>

        {/* Other users' ratings */}
        {Object.entries(localUsers).length > 0 && (
          <div className="flex gap-3 mt-2 flex-wrap">
            {Object.entries(localUsers).map(([userId, u]) => (
              <span
                key={userId}
                className={`text-xs px-2 py-0.5 rounded-full ${
                  userId === currentUserId
                    ? "bg-spotify-green/20 text-spotify-green border border-spotify-green/30"
                    : "bg-white/10 text-white/50"
                }`}
              >
                {u.displayName.split(" ")[0]}: {u.rating}
              </span>
            ))}
          </div>
        )}

        {/* Rating Input */}
        <div className="mt-3">
          <RatingInput
            trackId={track.id}
            currentRating={myRating}
            onRated={handleRated}
          />
        </div>
      </div>

      {/* Average Score */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 text-center">
        <span className={`text-3xl font-bold ${scoreColor}`}>
          {localAverage !== null ? localAverage.toFixed(1) : "—"}
        </span>
        <span className="text-xs text-white/30 mt-1">
          {localCount > 0 ? `${localCount} stem${localCount !== 1 ? "men" : ""}` : "geen"}
        </span>
      </div>
    </div>
  );
}
