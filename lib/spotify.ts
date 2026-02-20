export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string; width: number; height: number }[];
  };
  duration_ms: number;
  preview_url: string | null;
  external_urls: { spotify: string };
}

export interface PlaylistTrack {
  track: SpotifyTrack;
  added_by: { id: string };
  added_at: string;
}

export interface PlaylistResponse {
  tracks: {
    items: PlaylistTrack[];
    next: string | null;
    total: number;
  };
  name: string;
  images: { url: string }[];
}

export async function getPlaylistTracks(
  accessToken: string,
  playlistId: string
): Promise<PlaylistTrack[]> {
  const items: PlaylistTrack[] = [];
  let url: string | null =
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50&fields=next,items(added_by.id,added_at,track(id,name,artists,album,duration_ms,preview_url,external_urls))`;

  while (url) {
    const res: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
    const data: { items: PlaylistTrack[]; next: string | null } = await res.json();
    items.push(...data.items.filter((i) => i.track));
    url = data.next;
  }

  return items;
}

export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
