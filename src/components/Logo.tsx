/** Das Spukify-Logo: ein kleiner grüner Geist. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="140 110 232 300" aria-hidden="true">
      <path
        fill="#1ed760"
        d="M156 374 V214 A100 100 0 0 1 356 214 V374 A33.33 33.33 0 0 1 289.33 374 A33.33 33.33 0 0 1 222.67 374 A33.33 33.33 0 0 1 156 374 Z"
      />
      <ellipse cx="218" cy="226" rx="18" ry="25" fill="#121212" />
      <ellipse cx="294" cy="226" rx="18" ry="25" fill="#121212" />
    </svg>
  )
}
