// Die Sprüche des Kommentators 🎙️
import { getSkin } from './data'
import type { RarityId } from './data'
import { itemValue, rarityRank } from './roll'
import type { Item } from './roll'

function pick(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)]
}

const BY_RARITY: Record<RarityId, string[]> = {
  blau: [
    'Wieder blau. Wie mein Kontostand.',
    'Ein echtes Sammlerstück … für den Mülleimer.',
    'Blau macht glücklich. Sagt niemand. Nie.',
    'Das zählt wenigstens als Erfahrung.',
    'Hey, immerhin ist es eine Waffe. Glaube ich.',
    'Das Case hat dich gesehen und gelacht.',
    'Militärstandard. Standard wie dein Glück.',
    'Mach ruhig weiter, das nächste wird bestimmt besser. (Wird es nicht.)',
  ],
  lila: [
    'Lila! Immerhin etwas.',
    'Okay, okay – das kann man zeigen.',
    'Lila Laune! Fast schon selten.',
    'Nicht schlecht. Nicht gut. Aber nicht schlecht.',
  ],
  pink: [
    'PINK! Mama, schau mal!',
    'Jetzt bloß nicht übermütig werden …',
    'Der Chat schreibt „W“.',
    'Pink! Das ist mehr wert als dein Frühstück.',
  ],
  rot: [
    'ROT! Zittern die Hände schon?',
    'Screenshot machen. JETZT.',
    'Verdeckt! Und du hast es aufgedeckt. Legende.',
    'Okay, das war gerade richtig gut.',
  ],
  gold: [
    'MESSER!!! 🔪 Der Chat dreht komplett durch!',
    'Jahrelanges Training hat sich ausgezahlt. Also drei Minuten.',
    'Ruf deine Freunde an. Sofort.',
    'Das ist kein Glück mehr, das ist Talent. (Es ist Glück.)',
  ],
  mac: ['Die MAC-10. DIE MAC-10. Niemals verkaufen. NIEMALS.'],
}

const BLUE_STREAK = [
  'Schon wieder nur Blaue. Das Spiel mag dich nicht.',
  'Statistisch gesehen bist du jetzt ein Fall für die Wissenschaft.',
  'So viele Blaue am Stück – das muss Absicht sein.',
  'Vielleicht mal eine Pause? Die Cases brauchen Erholung von dir.',
]

const BIG_LOSS = [
  'Du hast gerade {x} Münzen verbrannt. Respekt.',
  '{x} Münzen weg. Aber die Erfahrung, die Erfahrung!',
  'Minus {x}. Das nennt man Investition. Oder so.',
]

const BROKE = [
  'Pleite. Zeit fürs Aim-Training.',
  'Dein Geldbeutel weint leise.',
  'Keine Münzen mehr? Die Minispiele warten schon.',
]

export function quipForOpen(items: Item[], cost: number, blueStreak: number, coins: number): string {
  const skins = items.map((i) => getSkin(i.skinId)!)
  const best = skins.reduce((a, b) => (rarityRank(b.rarity) > rarityRank(a.rarity) ? b : a))
  const bestItem = items[skins.indexOf(best)]
  const value = items.reduce((s, i) => s + itemValue(i), 0)

  if (best.rarity === 'mac' || best.rarity === 'gold' || best.rarity === 'rot') return pick(BY_RARITY[best.rarity])
  if (coins < 100) return pick(BROKE)
  if (best.rarity === 'blau' && blueStreak >= 10) return `${blueStreak} Blaue in Folge. ` + pick(BLUE_STREAK)
  if (items.length >= 10 && value < cost * 0.6) return quipLoss(cost - value)
  if (bestItem.float > 0.9) return `Float ${bestItem.float.toFixed(3)} … sieht aus wie aus dem Mülleimer gezogen.`
  if (bestItem.float < 0.01) return `Float ${bestItem.float.toFixed(4)}! Fast perfekt. Nicht anfassen!`
  return pick(BY_RARITY[best.rarity])
}

export function quipLoss(lost: number): string {
  return pick(BIG_LOSS).replace('{x}', lost.toLocaleString('de-DE'))
}

export const BOMB_BOOM = [
  'BOOM. Das war wohl der falsche Draht.',
  'Terroristen gewinnen. Schon wieder.',
  'Rot oder blau? Offensichtlich keins von beiden.',
  'Die Bombe hat gewonnen. 1:0.',
]

export const BOMB_DEFUSED = ['Bombe entschärft! Held des Tages.', 'Sauber! Nicht mal geschwitzt.', 'Antiterroreinheit gewinnt!']

export const TOO_EARLY = ['Zu früh! Geduld ist eine Tugend. 🤡', 'Hellseher, oder was?', 'Grün heißt los. Nicht vorher. 🤡']

export const HOSTAGE = ['Das war eine Geisel! 😱', 'Die Geisel wollte nur nach Hause …', 'Geisel getroffen. Peinlich.']

export function pickQuip(list: string[]): string {
  return pick(list)
}
