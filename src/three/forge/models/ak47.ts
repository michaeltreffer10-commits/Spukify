// AK-47 (AKM-Bauweise) – nachgebaut nach den Proportionen des echten Gewehrs, in Millimetern.
// X = 0 ist das hintere Ende des Gehäuses, Y = 0 seine Unterkante, Laufachse bei Y = 30.
import { PartList, block, lathe, pin, profile, rod, section } from '../geometry'
import type { ForgeModel } from '../types'

const BORE_Y = 30

function build() {
  const p = new PartList()

  // ---------- Gehäuse ----------
  p.add('Gehäuse', 'paint', block(0, 300, 0, 38, -15, 15, 1.6))
  // Staubschutzdeckel mit gewölbtem Querschnitt
  p.add(
    'Staubschutzdeckel',
    'paint',
    section('M-15 34 L-15 44 Q-15 51 -8 51 L8 51 Q15 51 15 44 L15 34 Z', { from: 10, to: 294, bevel: 1.2 }),
  )
  // Querrippen auf dem Deckel (wie beim AKM)
  for (const x of [118, 138]) p.add('Deckelrippe', 'paint', block(x, x + 6, 48, 52.2, -10, 10, 1.4))
  p.add('Deckelknopf', 'darkMetal', block(2, 12, 36, 48, -9, 9, 2))
  // Vorderes Verbindungsstück (Trunnion) und Kimmenfuß
  p.add('Trunnion', 'darkMetal', block(292, 334, 2, 44, -14, 14, 2))
  p.add('Kimmenfuß', 'metal', profile('M300 42 L340 42 L340 50 L314 56 L300 56 Z', { thickness: 22, bevel: 2 }))
  p.add('Visierblatt', 'metal', block(306, 334, 55, 58, -6, 6, 0.6))
  // Auswurffenster (rechte Seite) als dunkle Vertiefung
  p.add('Auswurffenster', 'darkMetal', block(150, 214, 25, 37, 13.8, 15.4, 1))
  // Sicherungshebel (rechte Seite)
  p.add('Sicherungshebel', 'metal', profile('M60 37 L236 32 L262 18 L268 22 L246 36 L62 41 Z', { thickness: 2, bevel: 0.6, z: 16 }))
  // Spannhebel
  p.add('Spannhebel', 'metal', pin(262, 40, 3, 14, 26))
  p.add('Spannhebel-Knauf', 'metal', pin(262, 40, 5, 22, 28))
  // Nieten auf beiden Seiten
  for (const [x, y] of [
    [20, 8],
    [20, 30],
    [96, 6],
    [190, 6],
    [216, 6],
    [280, 8],
    [280, 30],
    [300, 22],
    [318, 22],
  ])
    p.add('Niete', 'darkMetal', pin(x, y, 2.1, -15.8, 15.8, 12))

  // ---------- Griff, Abzug, Bügel ----------
  p.add(
    'Pistolengriff',
    'paint',
    profile('M78 2 L104 2 L100 -20 L90 -84 Q89 -92 81 -92 L67 -92 Q60 -92 61 -85 L66 -40 Z', { thickness: 28, bevel: 6 }),
  )
  p.add(
    'Abzugsbügel',
    'metal',
    profile('M105 1 L109 1 L109 -18 Q109 -24 116 -24 L166 -24 L166 1 L170 1 L170 -28 L114 -28 Q105 -28 105 -18 Z', {
      thickness: 7,
      bevel: 1,
    }),
  )
  p.add('Abzug', 'metal', profile('M128 1 L134 1 Q137 -10 131 -19 L127 -18 Q131 -9 128 1 Z', { thickness: 5, bevel: 0.8 }))
  p.add('Magazinhalter', 'metal', block(166, 176, -10, 1, -6, 6, 1))

  // ---------- Magazin (gebogen) ----------
  p.add(
    'Magazin',
    'paint',
    profile('M174 4 L224 4 C228 -60 248 -148 292 -220 L248 -238 C208 -168 186 -90 174 4 Z', { thickness: 26, bevel: 3 }),
  )
  // Verstärkungsrippen an der Seite
  for (const [a, b] of [
    [196, -40],
    [212, -100],
    [236, -160],
  ])
    p.add('Magazinrippe', 'paint', block(a - 14, a + 14, b - 3, b + 3, -13.8, 13.8, 1.2))

  // ---------- Vorderschaft und Lauf ----------
  p.add(
    'Unterer Handschutz',
    'paint',
    section('M-17 18 L-17 30 Q-17 40 -11 40 L11 40 Q17 40 17 30 L17 18 Q17 7 6 5 L-6 5 Q-17 7 -17 18 Z', {
      from: 334,
      to: 452,
      bevel: 3,
    }),
  )
  p.add('Oberer Handschutz', 'paint', section('M-12 43 L-12 49 Q-12 58 0 58 Q12 58 12 49 L12 43 Z', { from: 338, to: 464, bevel: 2 }))
  p.add('Handschutz-Ring', 'darkMetal', block(450, 460, 4, 42, -15, 15, 2))
  p.add(
    'Lauf',
    'metal',
    lathe(
      [
        [0, 330],
        [9, 330],
        [9, 500],
        [8, 506],
        [8, 650],
        [0, 650],
      ],
      { y: BORE_Y },
    ),
  )
  p.add('Gasrohr', 'metal', rod(462, 506, 7, 50))
  p.add('Gasblock', 'darkMetal', profile('M498 22 L522 22 L524 58 L496 58 Z', { thickness: 20, bevel: 2.5 }))
  p.add('Putzstock', 'metal', rod(452, 642, 2.2, 15))
  // Kornfuß mit Schutzohren
  p.add('Kornfuß', 'darkMetal', profile('M612 20 L642 20 L642 38 L634 42 L633 60 L628 60 L625 44 L612 38 Z', { thickness: 16, bevel: 1.5 }))
  p.add(
    'Kornschutz',
    'darkMetal',
    profile('M620 40 L638 40 L637 66 L633 66 L633 50 L625 50 L625 66 L621 66 Z', { thickness: 18, bevel: 1 }),
  )
  p.add('Bajonetthalter', 'darkMetal', block(598, 614, 14, 24, -5, 5, 1.5))
  // Schräge Mündungsbremse
  p.add(
    'Mündungsbremse',
    'darkMetal',
    lathe(
      [
        [0, 648],
        [10.5, 648],
        [10.5, 682],
        [9, 688],
        [0, 688],
      ],
      { y: BORE_Y },
    ),
  )

  // ---------- Schaft ----------
  p.add(
    'Schaft',
    'paint',
    profile(
      'M6 40 L6 4 L-36 -10 C-106 -38 -194 -64 -264 -88 L-280 -92 L-288 -90 L-292 10 L-284 17 C-210 19 -106 27 -36 38 Z',
      { thickness: 40, bevel: 9, curveSegments: 32 },
    ),
  )
  p.add('Schaftkappe', 'darkMetal', profile('M-283 18 L-293 17 L-298 -92 L-287 -93 Z', { thickness: 40, bevel: 4 }))
  p.add('Schaftschraube', 'darkMetal', pin(-60, 18, 3, -20.5, 20.5, 14))

  return p.parts
}

export const ak47: ForgeModel = {
  name: 'AK-47',
  build,
  // Sticker-Plätze auf der rechten Seite (+Z)
  stickers: [
    { x: 60, y: 19, z: 15.3 },
    { x: 118, y: 19, z: 15.3 },
    { x: 236, y: 16, z: 15.3 },
    { x: -150, y: -10, z: 20.3 },
  ],
}
