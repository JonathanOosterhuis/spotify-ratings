"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface PlaylistTrack {
  track: {
    id: string;
    name: string;
    artists: { name: string }[];
  };
}

interface RatingData {
  average: number | null;
  count: number;
  users: Record<string, { rating: number; displayName: string }>;
}

interface TrackWithRatings {
  track: PlaylistTrack["track"];
  ratings: RatingData;
}

export default function StatsPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<TrackWithRatings[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    setLoading(true);
    try {
      const playlistRes = await fetch("/api/playlist");
      if (!playlistRes.ok) return;
      const { tracks } = await playlistRes.json();

      const results = await Promise.all(
        tracks.map((t: PlaylistTrack) =>
          fetch(`/api/ratings?trackId=${t.track.id}`)
            .then((r) => r.json())
            .then((d: RatingData) => ({ track: t.track, ratings: d }))
        )
      );
      setData(results);
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
        <p className="text-white/60">Log in om de statistieken te zien</p>
        <button
          onClick={() => signIn("spotify")}
          className="bg-spotify-green hover:bg-[#1ed760] text-black font-bold px-6 py-3 rounded-full transition-colors"
        >
          Inloggen met Spotify
        </button>
      </div>
    );
  }

  const currentUserId = session.spotifyId ?? "";

  // --- Compute stats ---
  const myRatedTracks = data.filter((d) => d.ratings.users[currentUserId]);
  const myRatings = myRatedTracks.map((d) => d.ratings.users[currentUserId].rating);
  const myAvg = myRatings.length > 0
    ? myRatings.reduce((a, b) => a + b, 0) / myRatings.length
    : null;

  const myHighest = myRatedTracks.reduce<TrackWithRatings | null>((best, d) => {
    if (!best) return d;
    return d.ratings.users[currentUserId].rating > best.ratings.users[currentUserId].rating ? d : best;
  }, null);

  const myLowest = myRatedTracks.reduce<TrackWithRatings | null>((worst, d) => {
    if (!worst) return d;
    return d.ratings.users[currentUserId].rating < worst.ratings.users[currentUserId].rating ? d : worst;
  }, null);

  // Group stats: spread = max - min rating
  const tracksWithSpread = data
    .filter((d) => d.ratings.count >= 2)
    .map((d) => {
      const scores = Object.values(d.ratings.users).map((u) => u.rating);
      const spread = Math.max(...scores) - Math.min(...scores);
      return { ...d, spread };
    });

  const mostControversial = tracksWithSpread.reduce<(TrackWithRatings & { spread: number }) | null>(
    (best, d) => (!best || d.spread > best.spread ? d : best),
    null
  );

  const allRatersIds = [...new Set(data.flatMap((d) => Object.keys(d.ratings.users)))];
  const totalRaters = allRatersIds.length;

  const mostAgreed = data
    .filter((d) => d.ratings.count >= totalRaters && totalRaters >= 2)
    .map((d) => {
      const scores = Object.values(d.ratings.users).map((u) => u.rating);
      const spread = Math.max(...scores) - Math.min(...scores);
      return { ...d, spread };
    })
    .reduce<(TrackWithRatings & { spread: number }) | null>(
      (best, d) => (!best || d.spread < best.spread ? d : best),
      null
    );

  const hiddenGems = data.filter(
    (d) => d.ratings.count === 1 && (d.ratings.average ?? 0) >= 7
  );

  const mostRated = data.reduce<TrackWithRatings | null>(
    (best, d) => (!best || d.ratings.count > best.ratings.count ? d : best),
    null
  );

  // Per-user comparison table
  const userStats: Record<string, { displayName: string; totalRating: number; count: number }> = {};
  for (const d of data) {
    for (const [uid, u] of Object.entries(d.ratings.users)) {
      if (!userStats[uid]) {
        userStats[uid] = { displayName: u.displayName, totalRating: 0, count: 0 };
      }
      userStats[uid].totalRating += u.rating;
      userStats[uid].count += 1;
    }
  }

  const StatCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-[#121212]/95 backdrop-blur border-b border-white/5 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/60 hover:text-white transition-colors text-sm">
              ← Terug
            </Link>
            <h1 className="font-bold text-lg">Statistieken</h1>
          </div>
          <Link
            href="/leaderboard"
            className="text-sm text-white/60 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            Ranglijst
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="w-10 h-10 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
            <p className="text-white/40">Statistieken laden...</p>
          </div>
        ) : (
          <>
            {/* Jouw stats */}
            <section>
              <h2 className="text-lg font-bold mb-3">Jouw stats</h2>
              <div className="grid grid-cols-2 gap-3">
                <StatCard title="Gemiddeld cijfer">
                  <span className="text-3xl font-bold text-spotify-green">
                    {myAvg !== null ? myAvg.toFixed(1) : "—"}
                  </span>
                </StatCard>
                <StatCard title="Beoordeeld">
                  <span className="text-3xl font-bold text-white">
                    {myRatedTracks.length}
                    <span className="text-lg text-white/40"> / {data.length}</span>
                  </span>
                </StatCard>
                <StatCard title="Hoogst beoordeeld">
                  {myHighest ? (
                    <>
                      <p className="text-sm font-semibold text-white truncate">{myHighest.track.name}</p>
                      <p className="text-xs text-white/40 truncate">{myHighest.track.artists.map((a) => a.name).join(", ")}</p>
                      <p className="text-2xl font-bold text-spotify-green mt-1">
                        {myHighest.ratings.users[currentUserId].rating}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-white/30">Nog niet beoordeeld</p>
                  )}
                </StatCard>
                <StatCard title="Laagst beoordeeld">
                  {myLowest ? (
                    <>
                      <p className="text-sm font-semibold text-white truncate">{myLowest.track.name}</p>
                      <p className="text-xs text-white/40 truncate">{myLowest.track.artists.map((a) => a.name).join(", ")}</p>
                      <p className="text-2xl font-bold text-red-400 mt-1">
                        {myLowest.ratings.users[currentUserId].rating}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-white/30">Nog niet beoordeeld</p>
                  )}
                </StatCard>
              </div>
            </section>

            {/* Groepsstatistieken */}
            <section>
              <h2 className="text-lg font-bold mb-3">Groepsstatistieken</h2>
              <div className="space-y-3">
                <StatCard title="🔥 Meest omstreden">
                  {mostControversial ? (
                    <>
                      <p className="text-sm font-semibold text-white">{mostControversial.track.name}</p>
                      <p className="text-xs text-white/40">{mostControversial.track.artists.map((a) => a.name).join(", ")}</p>
                      <p className="text-xs text-white/50 mt-1">Verschil: {mostControversial.spread} punten</p>
                    </>
                  ) : (
                    <p className="text-sm text-white/30">Niet genoeg beoordelingen</p>
                  )}
                </StatCard>

                <StatCard title="🤝 Meest eens">
                  {mostAgreed ? (
                    <>
                      <p className="text-sm font-semibold text-white">{mostAgreed.track.name}</p>
                      <p className="text-xs text-white/40">{mostAgreed.track.artists.map((a) => a.name).join(", ")}</p>
                      <p className="text-xs text-white/50 mt-1">Verschil: slechts {mostAgreed.spread} punt{mostAgreed.spread !== 1 ? "en" : ""}</p>
                    </>
                  ) : (
                    <p className="text-sm text-white/30">Niemand heeft alles beoordeeld</p>
                  )}
                </StatCard>

                <StatCard title="💎 Geheime parels (≥7, slechts 1 stem)">
                  {hiddenGems.length > 0 ? (
                    <ul className="space-y-1.5">
                      {hiddenGems.map((d) => (
                        <li key={d.track.id} className="flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="text-sm text-white truncate">{d.track.name}</p>
                            <p className="text-xs text-white/40 truncate">{d.track.artists.map((a) => a.name).join(", ")}</p>
                          </div>
                          <span className="text-spotify-green font-bold ml-3 flex-shrink-0">
                            {d.ratings.average?.toFixed(1)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-white/30">Geen geheime parels</p>
                  )}
                </StatCard>

                <StatCard title="📊 Meest beoordeeld">
                  {mostRated && mostRated.ratings.count > 0 ? (
                    <>
                      <p className="text-sm font-semibold text-white">{mostRated.track.name}</p>
                      <p className="text-xs text-white/40">{mostRated.track.artists.map((a) => a.name).join(", ")}</p>
                      <p className="text-xs text-white/50 mt-1">{mostRated.ratings.count} stem{mostRated.ratings.count !== 1 ? "men" : ""}</p>
                    </>
                  ) : (
                    <p className="text-sm text-white/30">Nog geen beoordelingen</p>
                  )}
                </StatCard>
              </div>
            </section>

            {/* Scorevergelijking */}
            {Object.keys(userStats).length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-3">Scorevergelijking</h2>
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-4 py-3 text-xs text-white/40 font-semibold uppercase tracking-wider">Naam</th>
                        <th className="text-right px-4 py-3 text-xs text-white/40 font-semibold uppercase tracking-wider">Gem. gegeven</th>
                        <th className="text-right px-4 py-3 text-xs text-white/40 font-semibold uppercase tracking-wider"># Beoordeeld</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(userStats)
                        .sort((a, b) => b[1].count - a[1].count)
                        .map(([uid, u]) => (
                          <tr
                            key={uid}
                            className={`border-b border-white/5 last:border-0 ${uid === currentUserId ? "bg-spotify-green/5" : ""}`}
                          >
                            <td className="px-4 py-3 font-medium">
                              {u.displayName.split(" ")[0]}
                              {uid === currentUserId && (
                                <span className="ml-1 text-xs text-spotify-green">(jij)</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-white/80">
                              {(u.totalRating / u.count).toFixed(1)}
                            </td>
                            <td className="px-4 py-3 text-right text-white/60">{u.count}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
