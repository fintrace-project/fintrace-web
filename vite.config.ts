import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { parse } from 'yaml'

// The UI's messages live in YAML (src/core/i18n); they reach the browser as plain JS, with no parser shipped
const yaml = (): Plugin => ({
  name: 'fintrace-yaml',
  transform(code, id) {
    if (id.endsWith('.yml')) {
      return { code: `export default ${JSON.stringify(parse(code))}`, map: null }
    }
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), yaml()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Read by scripts/check-bundle-limits.ts; the image leaves it out
  build: {
    manifest: true,
    // An inlined font is a data: URL, which the production CSP's font-src 'self' refuses (§3.3)
    assetsInlineLimit: (file) => (file.endsWith('.woff2') ? false : undefined),
  },
  // The BFF replaces it in index.html with each response's nonce, the one its CSP allows for styles (§3.3)
  html: {
    cspNonce: '__CSP_NONCE__',
  },
  // In the local stack the BFF proxies here with the upstream's own Host, which Vite refuses unless listed.
  server: {
    allowedHosts: ['fintrace-web'],
  },
})
