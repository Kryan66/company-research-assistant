import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import cors from 'cors'
import researchRoutes from './routes/research.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '..', 'dist')

const app = express()
const PORT = process.env.PORT || 3001
const isProduction = process.env.NODE_ENV === 'production'

app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    serper: !!process.env.SERPER_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
  })
})

app.use('/api', researchRoutes)

// In production (e.g. Render), serve the Vite build — local dev uses Vite separately
if (isProduction) {
  app.use(express.static(distPath))

  // SPA fallback: any non-API route gets index.html for client-side routing
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      next()
      return
    }
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) next(err)
    })
  })
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  if (isProduction) {
    console.log(`Serving frontend from ${distPath}`)
  }
})
