"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Leaderboard from "@/components/Leaderboard";

interface PlaylistTrack {
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
}

interface LeaderboardEntry {
  rank: number;
  track: PlaylistTrack["track"];
  average: number;
  count: number;
}

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      loadLeaderboard();
    }
  }, [session]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const playlistRes = await fetch("/api/playlist");
      if (!playlistRes.ok) return;
      const { tracks } = await playlistRes.json();

      const ratingResults = await Promise.all(
        tracks.map((t: PlaylistTrack) =>
          fetch(`/api/ratings?trackId=${t.track.id}`)
            .then((r) => r.json())
            .then((d) => ({ track: t.track, ...d }))
        )
      );

      const ranked = ratingResults
        .filter((r) => r.average !== null && r.count > 0)
        .sort((a, b) => b.average - a.average)
        .map((r, i) => ({ ...r, rank: i + 1 }));

      setEntries(ranked);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <p className="text-white/60">Log in om de ranglijst te zien</p>
        <button
          onClick={() => signIn("spotify")}
          className="bg-spotify-green hover:bg-[#1ed760] text-black font-bold px-6 py-3 rounded-full transition-colors"
        >
          Inloggen met Spotify
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-[#121212]/95 backdrop-blur border-b border-white/5 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-white/60 hover:text-white transition-colors text-sm"
            >
              ← Terug
            </Link>
            <h1 className="font-bold text-lg">Ranglijst</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/stats"
              className="text-sm text-white/60 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              Stats
            </Link>
            <button
              onClick={loadLeaderboard}
              className="text-xs text-white/40 hover:text-white transition-colors"
            >
              Vernieuwen
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="w-10 h-10 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
            <p className="text-white/40">Ranglijst laden...</p>
          </div>
        ) : (
          <Leaderboard entries={entries} />
        )}
      </main>
    </div>
  );
}
