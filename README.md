# Spotify Ratings

Drie broers, één gedeelde playlist, iedereen geeft een cijfer 1-10 per nummer. Gemiddelde scores direct zichtbaar. Ranglijst van best beoordeelde nummers.

**Tech:** Next.js 14 · NextAuth v5 (Spotify OAuth) · Firebase Firestore · Tailwind CSS · Vercel

---

## Setup (eenmalig)

### 1. Spotify Developer App

1. Ga naar [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Klik **Create app**
3. Vul in:
   - App name: `Spotify Ratings`
   - Redirect URI: `http://localhost:3000/api/auth/callback/spotify`
   - (Later voor productie ook toevoegen: `https://jouwdomein.vercel.app/api/auth/callback/spotify`)
4. Ga naar **Settings** → kopieer **Client ID** en **Client Secret**
5. Zoek je gedeelde playlist op Spotify → kopieer het **Playlist ID** uit de URL (`spotify.com/playlist/PLAYLIST_ID_HIER`)

### 2. Firebase Project

1. Ga naar [console.firebase.google.com](https://console.firebase.google.com)
2. Klik **Add project** → geef het een naam → aanmaken
3. Ga naar **Firestore Database** → **Create database** → kies **Production mode** → kies regio (bijv. `europe-west1`)
4. Ga naar **Project Settings** (tandwieltje) → **Your apps** → klik het `</>` icoontje (Web app)
5. Registreer de app, kopieer de `firebaseConfig` waarden
6. Ga naar **Firestore** → **Rules** → plak de inhoud van `firestore.rules` → **Publish**

### 3. .env.local invullen

Open `.env.local` en vul alle lege waarden in:

```env
SPOTIFY_CLIENT_ID=abc123...
SPOTIFY_CLIENT_SECRET=def456...
SPOTIFY_PLAYLIST_ID=37i9dQ...

AUTH_SECRET=<al ingevuld>
NEXTAUTH_URL=http://localhost:3000

NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mijnproject.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mijnproject
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mijnproject.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 4. Lokaal starten

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → log in met Spotify → klaar.

---

## Deploy naar Vercel (gratis)

1. Push dit project naar GitHub
2. Ga naar [vercel.com](https://vercel.com) → **New Project** → importeer de GitHub repo
3. Voeg alle `.env.local` waarden toe onder **Environment Variables** in Vercel
4. Zet `NEXTAUTH_URL` op je Vercel domein, bijv. `https://spotify-ratings-xyz.vercel.app`
5. Voeg datzelfde domein ook toe als Redirect URI in je Spotify Developer App
6. Klik **Deploy**

Deel de Vercel URL met je broers — iedereen logt in met zijn eigen Spotify account.

---

## Structuur

```
app/
  page.tsx                 # Hoofdpagina: playlist + ratings
  leaderboard/page.tsx     # Ranglijst
  api/
    auth/[...nextauth]/    # Spotify OAuth
    playlist/              # Playlist ophalen via server (beveiligd)
    ratings/               # Scores opslaan/ophalen in Firestore
components/
  TrackCard.tsx            # Nummer met albumhoes, scores, ratingknoppen
  RatingInput.tsx          # 1-10 knoppen
  Leaderboard.tsx          # Gesorteerde ranglijst
lib/
  firebase.ts              # Firestore connectie
  spotify.ts               # Spotify API helpers
auth.ts                    # NextAuth configuratie
firestore.rules            # Firestore beveiligingsregels
```
