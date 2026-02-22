"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import TrackCard from "@/components/TrackCard";

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
  added_by: { id: string };
  added_at: string;
}

interface RatingData {
  average: number | null;
  count: number;
  users: Record<string, { rating: number; displayName: string }>;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [ratings, setRatings] = useState<Record<string, RatingData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (session) {
      loadPlaylist();
    }
  }, [session]);

  const loadPlaylist = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/playlist");
      if (!res.ok) throw new Error("Kon playlist niet laden");
      const data = await res.json();
      setTracks(data.tracks);
      // Load all ratings in parallel
      const ratingResults = await Promise.all(
        data.tracks.map((t: PlaylistTrack) =>
          fetch(`/api/ratings?trackId=${t.track.id}`)
            .then((r) => r.json())
            .then((d) => ({ id: t.track.id, data: d }))
        )
      );
      const ratingsMap: Record<string, RatingData> = {};
      ratingResults.forEach(({ id, data: d }) => {
        ratingsMap[id] = d;
      });
      setRatings(ratingsMap);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setLoading(false);
    }
  };

  const filteredTracks = tracks.filter(
    (t) =>
      t.track.name.toLowerCase().includes(search.toLowerCase()) ||
      t.track.artists.some((a) =>
        a.name.toLowerCase().includes(search.toLowerCase())
      )
  );

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🎵</div>
          <h1 className="text-4xl font-bold mb-2">Spotify Ratings</h1>
          <p className="text-white/60 text-lg">
            Beoordeel nummers in jullie gedeelde playlist
          </p>
        </div>
        <button
          onClick={() => signIn("spotify")}
          className="flex items-center gap-3 bg-spotify-green hover:bg-[#1ed760] text-black font-bold px-8 py-4 rounded-full text-lg transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          Inloggen met Spotify
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#121212]/95 backdrop-blur border-b border-white/5 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-spotify-green text-xl">🎵</span>
            <span className="font-bold text-lg hidden sm:block">Spotify Ratings</span>
          </div>

          <input
            type="text"
            placeholder="Zoek nummers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 max-w-xs bg-white/10 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-spotify-green/50 placeholder:text-white/30"
          />

          <nav className="flex items-center gap-2">
            <Link
              href="/leaderboard"
              className="text-sm text-white/60 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              Ranglijst
            </Link>
            <Link
              href="/stats"
              className="text-sm text-white/60 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              Stats
            </Link>
            <div className="flex items-center gap-2">
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? ""}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              )}
              <button
                onClick={() => signOut()}
                className="text-xs text-white/40 hover:text-white transition-colors"
              >
                Uitloggen
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="w-10 h-10 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
            <p className="text-white/40">Playlist laden...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={loadPlaylist}
              className="text-spotify-green hover:underline"
            >
              Opnieuw proberen
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white/80">
                {filteredTracks.length} nummer{filteredTracks.length !== 1 ? "s" : ""}
                {search && ` voor "${search}"`}
              </h2>
            </div>
            <div className="space-y-3">
              {filteredTracks.map(({ track, added_by }) => {
                const r = ratings[track.id] ?? {
                  average: null,
                  count: 0,
                  users: {},
                };
                return (
                  <TrackCard
                    key={track.id}
                    track={track}
                    addedBy={added_by?.id ?? "onbekend"}
                    average={r.average}
                    count={r.count}
                    users={r.users}
                    currentUserId={session.spotifyId ?? ""}
                  />
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
