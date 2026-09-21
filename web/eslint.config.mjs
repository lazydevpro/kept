import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

/*
 * ESLint is pinned to 9.x, not 10. `eslint-config-next@16` declares `eslint: ">=9"` but bundles
 * an `eslint-plugin-react` that still calls `context.getFilename()`, which ESLint 10 removed —
 * every React rule throws on load. Revisit when Next ships a config that works on 10.
 */
const config = [
  { ignores: ['.next/**', 'out/**', '.wrangler/**', 'next-env.d.ts', 'lib/tokens.generated.ts'] },
  ...coreWebVitals,
  ...typescript,
]

export default config
