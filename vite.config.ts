import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Für GitHub Pages läuft das Spiel unter /<Repo-Name>/.
// Der Workflow setzt BASE_PATH automatisch, lokal ist es "/".
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
})
