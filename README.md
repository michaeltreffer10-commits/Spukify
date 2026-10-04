# Spukify 👻

Ein Spotify-Client im Spotify-Look als Web-App (PWA). Man kann ihn auf dem Handy oder PC zum Home-Bildschirm hinzufügen.
Du meldest dich mit deinem Spotify-Konto an und kannst dann deine Playlists, Lieblingssongs, Alben und Künstler nutzen, suchen und abspielen.

## So funktioniert die Wiedergabe

Spukify spielt selbst keine Musik ab. Es **steuert die Spotify-App per Spotify Connect** (Handy, PC, Lautsprecher, …).
Dadurch funktionieren Hintergrund-Wiedergabe, Sperrbildschirm, Bluetooth und **Lossless** genau wie in der Spotify-App.
Lossless stellst du in der Spotify-App ein: Einstellungen → Audioqualität.

Voraussetzungen:

- Spotify **Premium** (Spotify verlangt das zum Steuern der Wiedergabe)
- Die Spotify-App ist auf dem Gerät installiert, auf dem die Musik laufen soll

## Funktionen

- Login mit Spotify (sicher per PKCE, ohne eigenen Server)
- Startseite mit Schnellzugriff, „Zuletzt gehört“, Top-Künstlern, Playlists und Alben
- Suche mit Filtern (Songs, Künstler, Alben, Playlists)
- Bibliothek mit Filtern und Sortierung
- Seiten für Playlists, Alben, Künstler und Lieblingssongs
- Player-Leiste (PC), Mini-Player und Vollbild-Player (Handy)
- Play/Pause, Vor/Zurück, Spulen, Zufall, Wiederholen und Lautstärke
- Geräteauswahl (Spotify Connect) und Warteschlange
- Songs liken, Playlists erstellen sowie Songs hinzufügen und entfernen
- **Demo-Modus** mit Beispieldaten, um die App ohne Spotify-Konto auszuprobieren

## Einrichtung

### 1. GitHub Pages aktivieren (einmalig)

Gehe im Repository auf **Settings → Pages** und stelle bei **Source** die Option **GitHub Actions** ein.
Danach wird die App bei jedem Push automatisch veröffentlicht unter:
`https://<github-name>.github.io/Spukify/`

### 2. Spotify-App anlegen (einmalig, ca. 2 Minuten)

1. Öffne das [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) und klicke auf **Create app**.
2. Als Redirect URI trägst du die Adresse deiner Spukify-Seite ein (z. B. `https://<github-name>.github.io/Spukify/`).
   Achte auf den Schrägstrich am Ende. Die genaue Adresse zeigt dir die App auch unter „Spotify verbinden“ an.
3. Bei den APIs wählst du **Web API** aus.
4. Kopiere die **Client ID** und trage sie in Spukify unter „Spotify verbinden“ ein.
   Alternativ kannst du sie fest einbauen: Lege unter **Settings → Secrets and variables → Actions → Variables** eine
   Variable `SPOTIFY_CLIENT_ID` an. Dann musst du sie auf keinem Gerät mehr eingeben.
5. Unter **User Management** trägst du alle Spotify-Konten ein, die Spukify nutzen dürfen (maximal 5).

### 3. Auf dem Handy installieren

- **iPhone:** Seite in Safari öffnen → „Teilen“ → „Zum Home-Bildschirm“
- **Android:** Seite in Chrome öffnen → Menü (⋮) → „App installieren“

## Lokal entwickeln

```bash
npm install
npm run dev        # http://127.0.0.1:5173
npm run build      # Produktions-Build in dist/
```

Für den Login am eigenen Rechner trägst du im Spotify Dashboard zusätzlich `http://127.0.0.1:5173/` als Redirect URI ein.
Spotify erlaubt dafür kein `localhost`.

## Einschränkungen durch Spotify (Stand 2026)

Seit Februar 2026 gelten für Apps im „Development Mode“ strengere Regeln:

- Höchstens 5 Nutzer pro App, und der Besitzer braucht Premium.
- Die **Songs fremder Playlists** (z. B. Playlists anderer Nutzer) liefert Spotify nicht mehr aus. Abspielen funktioniert trotzdem.
- „Beliebte Songs“ eines Künstlers ermittelt Spukify über die Suche, weil Spotify den Endpunkt dafür abgeschaltet hat.
- Die Suche liefert höchstens 10 Treffer pro Seite.

## Technik

React, TypeScript, Vite, TanStack Query und vite-plugin-pwa. Die App liegt komplett im Browser, es gibt keinen eigenen Server.
