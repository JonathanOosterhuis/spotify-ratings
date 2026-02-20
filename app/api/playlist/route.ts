import { auth } from "@/auth";
import { getPlaylistTracks } from "@/lib/spotify";
import { NextResponse } from "next/server";

const PLAYLIST_ID = process.env.SPOTIFY_PLAYLIST_ID!;

export async function GET() {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tracks = await getPlaylistTracks(session.accessToken, PLAYLIST_ID);
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("Playlist fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist" },
      { status: 500 }
    );
  }
}
