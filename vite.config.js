import react from '@vitejs/plugin-react'

export default {
  plugins: [react()],
  root: 'src/', // Sources files (typically where index.html is)
  publicDir: '../public/', // Path from "root" to static assets (files that are served as they are)
  server:
    {
      host: true, // Open to local network and display URL
    },
  build:
    {
      outDir: '../dist', // Output in the dist/ folder
      emptyOutDir: true, // Empty the folder first
      sourcemap: true, // Add sourcemap
    },
}
