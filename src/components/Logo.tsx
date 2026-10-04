/** Das Spukify-Logo: ein kleiner Geist mit Farbverlauf. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="140 110 232 300" aria-hidden="true">
      <defs>
        <linearGradient id="spukify-logo" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="0.55" stopColor="#f472b6" />
          <stop offset="1" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      <path
        fill="url(#spukify-logo)"
        d="M156 374 V214 A100 100 0 0 1 356 214 V374 A33.33 33.33 0 0 1 289.33 374 A33.33 33.33 0 0 1 222.67 374 A33.33 33.33 0 0 1 156 374 Z"
      />
      <ellipse cx="218" cy="226" rx="18" ry="25" fill="#0b0b12" />
      <ellipse cx="294" cy="226" rx="18" ry="25" fill="#0b0b12" />
    </svg>
  )
}
