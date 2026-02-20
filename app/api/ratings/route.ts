import { auth } from "@/auth";
import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.spotifyId || !session?.user?.name) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { trackId, rating } = await request.json();

  if (!trackId || typeof rating !== "number" || rating < 1 || rating > 10) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const trackRef = doc(db, "ratings", trackId);
  const userRef = doc(db, "ratings", trackId, "users", session.spotifyId);

  await setDoc(userRef, {
    rating,
    displayName: session.user.name,
    timestamp: serverTimestamp(),
  });

  // Recalculate average
  const usersSnapshot = await getDocs(collection(db, "ratings", trackId, "users"));
  let sum = 0;
  let count = 0;
  usersSnapshot.forEach((d) => {
    sum += d.data().rating;
    count++;
  });

  await setDoc(trackRef, { average: sum / count, count }, { merge: true });

  return NextResponse.json({ success: true, average: sum / count, count });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trackId = searchParams.get("trackId");

  if (!trackId) {
    return NextResponse.json({ error: "trackId required" }, { status: 400 });
  }

  const trackRef = doc(db, "ratings", trackId);
  const trackSnap = await getDoc(trackRef);
  const usersSnap = await getDocs(collection(db, "ratings", trackId, "users"));

  const users: Record<string, { rating: number; displayName: string }> = {};
  usersSnap.forEach((d) => {
    users[d.id] = {
      rating: d.data().rating,
      displayName: d.data().displayName,
    };
  });

  return NextResponse.json({
    ...(trackSnap.exists() ? trackSnap.data() : { average: null, count: 0 }),
    users,
  });
}
