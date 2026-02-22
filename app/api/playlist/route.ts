import { auth } from "@/auth";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

const PLAYLIST_ID = process.env.SPOTIFY_PLAYLIST_ID!;

export async function GET() {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`https://api.spotify.com/v1/playlists/${PLAYLIST_ID}`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    const raw = await res.json();
    const rawItems = raw.items?.items ?? [];

    // Load addedBy overrides from Firestore
    const metaSnap = await getDocs(collection(db, "trackMeta"));
    const metaMap: Record<string, string> = {};
    metaSnap.docs.forEach((d) => { metaMap[d.id] = d.data().addedBy; });

    const tracks = rawItems
      .filter((i: { item: unknown }) => i.item)
      .map((i: { item: { id: string } & Record<string, unknown>; added_by: { id: string }; added_at: string }) => ({
        track: i.item,
        added_by: { id: metaMap[i.item.id] ?? i.added_by?.id ?? "onbekend" },
        added_at: i.added_at,
      }));

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("Playlist fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist" },
      { status: 500 }
    );
  }
}
