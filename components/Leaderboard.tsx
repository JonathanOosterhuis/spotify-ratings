"use client";

import Image from "next/image";
import { formatDuration } from "@/lib/spotify";

interface LeaderboardEntry {
  rank: number;
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
  average: number;
  count: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

const medals = ["🥇", "🥈", "🥉"];

export default function Leaderboard({ entries }: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center text-white/40 py-16">
        <p className="text-4xl mb-4">🎵</p>
        <p>Nog geen beoordelingen. Begin met scoren!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const albumImage = entry.track.album.images[0]?.url;
        const scoreColor =
          entry.average >= 7
            ? "text-spotify-green"
            : entry.average >= 5
            ? "text-yellow-400"
            : "text-red-400";

        return (
          <div
            key={entry.track.id}
            className="bg-white/5 hover:bg-white/8 transition-colors rounded-xl p-4 flex items-center gap-4 border border-white/5"
          >
            {/* Rank */}
            <div className="w-8 text-center flex-shrink-0">
              {entry.rank <= 3 ? (
                <span className="text-xl">{medals[entry.rank - 1]}</span>
              ) : (
                <span className="text-white/30 font-bold">#{entry.rank}</span>
              )}
            </div>

            {/* Album Art */}
            <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-white/10">
              {albumImage ? (
                <Image
                  src={albumImage}
                  alt={entry.track.album.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20">
                  ♪
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <a
                href={entry.track.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white hover:text-spotify-green transition-colors truncate block text-sm"
              >
                {entry.track.name}
              </a>
              <p className="text-xs text-white/50 truncate">
                {entry.track.artists.map((a) => a.name).join(", ")} ·{" "}
                {formatDuration(entry.track.duration_ms)}
              </p>
            </div>

            {/* Score */}
            <div className="text-right flex-shrink-0">
              <span className={`text-2xl font-bold ${scoreColor}`}>
                {entry.average.toFixed(1)}
              </span>
              <p className="text-xs text-white/30">
                {entry.count} stem{entry.count !== 1 ? "men" : ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
