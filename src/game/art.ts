// Muster der Skins – gemeinsam genutzt von den 2D-Bildern und den 3D-Modellen.
import type { Pattern } from './data'

/** Das Muster eines Skins als SVG-Text (für <defs>) */
export function patternMarkup(id: string, pattern: Pattern, c: [string, string, string]): string {
  const [a, b, d] = c
  switch (pattern) {
    case 'solid':
      return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="112"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></linearGradient>`
    case 'fade':
      return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="10" y1="0" x2="250" y2="60"><stop offset="0" stop-color="${a}"/><stop offset="0.5" stop-color="${b}"/><stop offset="1" stop-color="${d}"/></linearGradient>`
    case 'stripes':
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="18" height="18" patternTransform="rotate(35)"><rect width="18" height="18" fill="${a}"/><rect width="7" height="18" fill="${b}"/><rect x="7" width="2" height="18" fill="${d}"/></pattern>`
    case 'camo':
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="64" height="48"><rect width="64" height="48" fill="${a}"/><ellipse cx="14" cy="12" rx="13" ry="8" fill="${b}"/><ellipse cx="46" cy="30" rx="15" ry="9" fill="${d}"/><ellipse cx="54" cy="6" rx="9" ry="6" fill="${b}"/><ellipse cx="20" cy="38" rx="10" ry="7" fill="${d}"/><ellipse cx="34" cy="16" rx="6" ry="4" fill="${d}"/></pattern>`
    case 'flames':
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="44" height="112"><rect width="44" height="112" fill="${a}"/><path d="M0 112 Q2 70 12 82 Q10 40 24 60 Q30 24 36 66 Q44 50 44 112 Z" fill="${b}"/><path d="M8 112 Q10 86 18 92 Q20 66 28 84 Q34 74 36 112 Z" fill="${d}"/></pattern>`
    case 'digital':
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="24" height="24"><rect width="24" height="24" fill="${a}"/><rect width="6" height="6" fill="${b}"/><rect x="12" y="6" width="6" height="6" fill="${d}"/><rect x="6" y="12" width="6" height="6" fill="${b}"/><rect x="18" y="18" width="6" height="6" fill="${d}"/><rect x="0" y="18" width="6" height="6" fill="${b}" opacity="0.6"/></pattern>`
    case 'waves':
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="40" height="16"><rect width="40" height="16" fill="${a}"/><path d="M0 8 Q10 0 20 8 T40 8" fill="none" stroke="${b}" stroke-width="3"/><path d="M0 14 Q10 6 20 14 T40 14" fill="none" stroke="${d}" stroke-width="1.5" opacity="0.7"/></pattern>`
    case 'dots':
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="14" height="14"><rect width="14" height="14" fill="${a}"/><circle cx="4" cy="4" r="3" fill="${b}"/><circle cx="11" cy="11" r="1.6" fill="${d}"/></pattern>`
    case 'marble':
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="90" height="60"><rect width="90" height="60" fill="${a}"/><path d="M0 10 Q20 30 40 14 T90 20" fill="none" stroke="${b}" stroke-width="5" opacity="0.8"/><path d="M0 40 Q30 24 50 46 T90 38" fill="none" stroke="${d}" stroke-width="2"/><path d="M10 60 Q30 50 44 30" fill="none" stroke="${d}" stroke-width="1" opacity="0.7"/></pattern>`
    case 'zebra':
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="30" height="112"><rect width="30" height="112" fill="${a}"/><path d="M4 0 Q14 28 6 56 Q0 84 10 112 L18 112 Q8 84 14 56 Q22 28 12 0 Z" fill="${b}"/><path d="M22 0 Q26 20 24 34 L27 34 Q29 20 26 0 Z" fill="${d}"/></pattern>`
    case 'hex':
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="24" height="42"><rect width="24" height="42" fill="${a}"/><path d="M12 0 L24 7 L24 21 L12 28 L0 21 L0 7 Z M12 28 V42" fill="none" stroke="${b}" stroke-width="1.6"/><circle cx="12" cy="14" r="2" fill="${d}"/></pattern>`
  }
}
