"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDocs, collection } from "firebase/firestore";

interface PlaylistTrack {
  track: { id: string; name: string; artists: { name: string }[] };
  added_by: { id: string };
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Added-by assignment
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [addedByMap, setAddedByMap] = useState<Record<string, string>>({});
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaSaved, setMetaSaved] = useState(false);

  useEffect(() => {
    if (!session) return;
    // Load playlist tracks
    fetch("/api/playlist").then((r) => r.json()).then((d) => {
      setTracks(d.tracks ?? []);
      // Load existing overrides from Firestore
      getDocs(collection(db, "trackMeta")).then((snap) => {
        const map: Record<string, string> = {};
        snap.docs.forEach((doc) => { map[doc.id] = doc.data().addedBy ?? ""; });
        // Pre-fill with current added_by if no override yet
        const filled: Record<string, string> = {};
        (d.tracks ?? []).forEach((t: PlaylistTrack) => {
          filled[t.track.id] = map[t.track.id] ?? t.added_by?.id ?? "";
        });
        setAddedByMap(filled);
      });
    });
  }, [session]);

  const saveAddedBy = async () => {
    setMetaLoading(true);
    setMetaSaved(false);
    await Promise.all(
      Object.entries(addedByMap).map(([trackId, name]) =>
        setDoc(doc(db, "trackMeta", trackId), { addedBy: name })
      )
    );
    setMetaLoading(false);
    setMetaSaved(true);
  };

  if (status === "loading") return null;

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-white/60">Log in om tracks toe te voegen</p>
        <button onClick={() => signIn("spotify")} className="bg-spotify-green text-black font-bold px-6 py-3 rounded-full">
          Inloggen met Spotify
        </button>
      </div>
    );
  }

  const handleSeed = async () => {
    const urls = input.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!urls.length) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackUrls: urls }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`✓ ${data.count} nummers opgeslagen in Firestore!`);
        setInput("");
      } else {
        setResult(`Fout: ${data.error}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="text-white/50 hover:text-white text-sm">← Terug</Link>
        <h1 className="text-xl font-bold">Playlist instellen</h1>
      </div>

      <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
        <h2 className="font-semibold">Stap 1 — Haal de track links op</h2>
        <ol className="text-sm text-white/60 space-y-1 list-decimal list-inside">
          <li>Open <a href="https://open.spotify.com" target="_blank" className="text-spotify-green underline">open.spotify.com</a> en ga naar de playlist</li>
          <li>Rechtsklik op een nummer → <strong className="text-white">Share</strong> → <strong className="text-white">Copy Song Link</strong></li>
          <li>Plak alle links hieronder (één per regel)</li>
          <li>Herhaal voor alle nummers in de playlist</li>
        </ol>

        <h2 className="font-semibold pt-2">Stap 2 — Plak de links</h2>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`https://open.spotify.com/track/abc123\nhttps://open.spotify.com/track/def456\n...`}
          className="w-full h-48 bg-black/30 border border-white/10 rounded-lg p-3 text-sm font-mono text-white/80 placeholder:text-white/20 outline-none focus:border-spotify-green/50 resize-none"
        />

        <button
          onClick={handleSeed}
          disabled={loading || !input.trim()}
          className="w-full bg-spotify-green hover:bg-[#1ed760] text-black font-bold py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Bezig..." : "Opslaan"}
        </button>

        {result && (
          <p className={`text-sm text-center ${result.startsWith("✓") ? "text-spotify-green" : "text-red-400"}`}>
            {result}
          </p>
        )}
      </div>

      {/* Added-by assignment */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4 mt-6">
        <h2 className="font-semibold">Wie heeft wat toegevoegd?</h2>
        <p className="text-sm text-white/50">Vul per nummer in wie het heeft toegevoegd. Dit overschrijft de Spotify data.</p>

        {tracks.length === 0 ? (
          <p className="text-sm text-white/30">Playlist laden...</p>
        ) : (
          <div className="space-y-2">
            {tracks.map(({ track }) => (
              <div key={track.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{track.name}</p>
                  <p className="text-xs text-white/40 truncate">{track.artists.map((a) => a.name).join(", ")}</p>
                </div>
                <input
                  type="text"
                  value={addedByMap[track.id] ?? ""}
                  onChange={(e) => setAddedByMap((m) => ({ ...m, [track.id]: e.target.value }))}
                  placeholder="Naam"
                  className="w-32 bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-spotify-green/50"
                />
              </div>
            ))}
          </div>
        )}

        <button
          onClick={saveAddedBy}
          disabled={metaLoading || tracks.length === 0}
          className="w-full bg-spotify-green hover:bg-[#1ed760] text-black font-bold py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {metaLoading ? "Opslaan..." : "Opslaan"}
        </button>

        {metaSaved && (
          <p className="text-sm text-center text-spotify-green">✓ Opgeslagen! Ververs de app om de wijzigingen te zien.</p>
        )}
      </div>
    </div>
  );
}
