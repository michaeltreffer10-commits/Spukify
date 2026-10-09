# CO3

Ein Case-Opening-Spiel im Browser, inspiriert von Counter-Strike 2. Alle Skins, Namen und Grafiken sind selbst gemacht.

## Was man machen kann

- **Cases öffnen**: drei Cases (Spuk, Neon, Inferno), mit dem typischen Band, das durchläuft und langsam stehen bleibt
- **Massen-Öffnen**: 1, 5, 10 oder 100 Cases auf einmal. Bei 5 und 10 laufen mehrere Bänder gleichzeitig, bei 100 drehen sich alle Karten nacheinander um
- **Schnell öffnen**: ohne Animation, direkt zum Ergebnis
- **Inventar**: filtern, sortieren, einzeln oder gesammelt verkaufen
- **Münzen verdienen**: Aim-Training (30 Sekunden Ziele treffen) und ein Tagesbonus alle 24 Stunden
- **Statistik**: geöffnete Cases, bester Drop, eigene Drop-Quote im Vergleich zur echten Chance

Der Spielstand wird im Browser gespeichert.

## Chancen

| Seltenheit | Chance |
|---|---|
| Militärstandard (blau) | 85 % |
| Limitiert (lila) | 12 % |
| Klassifiziert (pink) | 2,5 % |
| Verdeckt (rot) | 0,45 % |
| ★ Außergewöhnlich (Messer/Handschuhe) | 0,05 % (1 zu 2.000) |
| ??? | 1 zu 50.000 |

## Starten

```bash
npm install
npm run dev
```

Bei jedem Push auf `main` oder den Arbeits-Branch wird das Spiel automatisch auf GitHub Pages veröffentlicht.
