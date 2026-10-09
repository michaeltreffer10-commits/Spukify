# CO3

Ein Case-Opening-Spiel im Browser, inspiriert von Counter-Strike 2. Alle Skins, Namen und Grafiken sind selbst gemacht.

## Was man machen kann

- **Cases öffnen**: drei Cases (Spuk, Neon, Inferno). Eine 3D-Kiste springt auf, dann läuft das typische Band
- **Massen-Öffnen**: 1, 5, 10 oder 100 Cases auf einmal, oder ohne Animation mit „Schnell öffnen“
- **3D-Inspect**: jeden Skin in 3D ansehen und drehen, mit Lack und Kratzern je nach Abnutzung
- **Inventar**: filtern, sortieren, einzeln oder gesammelt verkaufen
- **Minispiele**: Aim-Training, Kopfschuss-Training (Vorsicht vor Geiseln), Bombe entschärfen und Reaktionstest
- **Level**: XP für Cases, Minispiele und Missionen. Jedes Level gibt Münzen und ein Gratis-Case, dazu +2 % auf Minispiel-Münzen
- **Tägliche Missionen**: drei Aufgaben pro Tag, Bonus für alle drei
- **Sammelalbum**: alle Skins eines Cases sammeln und Belohnungen abholen
- **Erfolge**: über 35 Erfolge, einige davon geheim
- **Zufalls-Ereignisse**: Glücksstunde, Rabattaktion, Doppel-XP, Händler-Wahnsinn und Münzregen
- **Kommentator und Meme-Sounds**: Sprüche zu jedem Drop, Airhorn, trauriges Posaunen-Wah-wah und Sprachansagen (in den Einstellungen abschaltbar)
- **Statistik**: geöffnete Cases, bester Drop, eigene Drop-Quote im Vergleich zur echten Chance

Alle Sounds werden live im Browser erzeugt, alle Grafiken und 3D-Modelle sind selbst gebaut.

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
