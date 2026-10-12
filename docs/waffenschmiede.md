# Waffenschmiede

Die Waffenschmiede baut die Waffen von CO3 als echte 3D-Modelle mit physikalisch basierten Materialien (PBR). Sie läuft komplett im Browser (Three.js/WebGL).

Die Modelle sind nach den echten Vorbildern nachgebaut. Die originalen CS2-Modelle, ihre Topologie und ihre UV-Layouts gehören Valve und werden nicht verwendet. Statt UV-Layouts nutzt der Lack-Shader eine **triplanare Projektion**: Das Muster wird über die Modellkoordinaten von drei Seiten projiziert und läuft so nahtlos über alle Teile.

## Aufbau

| Datei | Aufgabe |
|---|---|
| `src/three/forge/geometry.ts` | Geometrie-Baukasten in Millimetern: `profile` (Seitenprofil mit Dicke und runden Kanten), `section` (Querschnitt entlang der Waffe), `lathe` (Drehkörper wie Lauf, Mündung, Zielfernrohr), `rod`, `pin`, `block` |
| `src/three/forge/materials.ts` | Material-Slots `paint`, `metal`, `darkMetal`, `polymer`, `wood`, `rubber`, `glass`; Lack-Shader mit triplanarer Projektion; Pattern-Seed (0–1000) → Verschiebung, Drehung, Skalierung |
| `src/three/forge/studio.ts` | Prozedurales Studio-Licht (Softboxen → vorgefilterte Umgebungskarte), ACES-Tonemapping |
| `src/three/forge/models/*.ts` | Ein Modell pro Waffe (zurzeit: AK-47) |
| `src/three/forge/index.ts` | Liste der Modelle und `buildForgeWeapon()`: setzt Teile, Materialien und Sticker zusammen |
| `src/three/forge/ForgeViewer.tsx` | Betrachter zum Testen |

Koordinaten: **+X** zeigt zur Mündung, **+Y** nach oben, **Z** ist die Breite (rechte Seite = +Z). Alles in Millimetern.

## Ausführen

```bash
npm install
npm run dev
```

Dann im Browser `http://127.0.0.1:5173/#schmiede` öffnen. Dort lassen sich Skin, Float (Abnutzung) und Pattern-Seed live verstellen. Ziehen dreht die Waffe, das Mausrad zoomt.

Im Spiel nutzt die 3D-Ansicht (Inspect) automatisch das neue Modell, sobald es für eine Waffe eines gibt. Alle anderen Waffen nutzen weiter die alten Profil-Modelle.

## Eine neue Waffe hinzufügen

1. `src/three/forge/models/<waffe>.ts` anlegen und nach dem Vorbild von `ak47.ts` die Teile mit `PartList` zusammenbauen. Jedes Teil bekommt einen Material-Slot (`paint` wird vom Skin lackiert).
2. Sticker-Plätze (`stickers`) auf der rechten Seite festlegen.
3. Das Modell in `FORGE_MODELS` in `src/three/forge/index.ts` eintragen (Schlüssel = `ModelId` aus `src/game/models.ts`).

## Nächste Schritte

1. ~~Grundstruktur, Material-Pipeline, Studio-Licht, AK-47~~
2. Abnutzungs-Shader wie in CS2 (Wear-Masken, Kratzer, Kanten-Abrieb) und die Skin-Arten (Custom Paint, Gunsmith, Anodized, Patina, Hydrographic, Spray-Paint)
3. Render- und Export-Skripte (Inventarbilder aus 3D, GLB-Export mit gebackenen Texturen)
4. Feinschliff am Licht (Kontaktschatten, Studio-Varianten) und die übrigen Waffenmodelle
