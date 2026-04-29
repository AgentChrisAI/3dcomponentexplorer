import express from 'express'
const app = express()
app.use(express.json())
const PORT = process.env.PORT || 3001

// Simple placeholder to prove endpoints exist
app.get('/api/manifest', (req, res) => {
  res.json({ ok: true, message: 'manifest endpoint ready' })
})

app.listen(PORT, () => console.log(`API server listening on ${PORT}`))
