import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

const LOREBOOKS_DIR = resolve(__dirname, 'src', 'lorebooks')
const CHANGE_FILE = resolve(LOREBOOKS_DIR, '.last-change.json')

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'lorebook-sync',
      configureServer(server) {
        // Ensure lorebooks dir exists
        try { mkdirSync(LOREBOOKS_DIR, { recursive: true }) } catch {}

        // POST /api/lorebook-sync — receives entry save events from the editor
        server.middlewares.use('/api/lorebook-sync', (req, res) => {
          if (req.method !== 'POST') {
            res.writeHead(405); res.end('Method Not Allowed'); return;
          }

          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              const payload = JSON.parse(body)

              // Write the change to .last-change.json
              const change = {
                timestamp: Date.now(),
                time: new Date().toISOString(),
                action: payload.action,        // 'created' | 'updated'
                lorebookId: payload.lorebookId,
                lorebookName: payload.lorebookName,
                entry: payload.entry,          // the full entry object
                entryPreview: payload.entry?.content?.slice(0, 200) || '',
              }
              writeFileSync(CHANGE_FILE, JSON.stringify(change, null, 2), 'utf-8')
              console.log(`[lorebook-sync] ${payload.action}: "${payload.entry?.keys?.[0] || '?'}" → ${CHANGE_FILE}`)

              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ ok: true }))
            } catch (err) {
              console.error('[lorebook-sync] Parse error:', err)
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ ok: false, error: String(err) }))
            }
          })
        })

        // POST /api/preset-sync — receives preset save events from settings
        server.middlewares.use('/api/preset-sync', (req, res) => {
          if (req.method !== 'POST') { res.writeHead(405); res.end('Method Not Allowed'); return; }
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              const payload = JSON.parse(body)
              const presetFile = resolve(LOREBOOKS_DIR, '.last-preset.json')
              writeFileSync(presetFile, JSON.stringify({ timestamp: Date.now(), time: new Date().toISOString(), ...payload }, null, 2), 'utf-8')
              console.log(`[preset-sync] ${payload.action}: "${payload.presetName}"`)
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ ok: true }))
            } catch (err) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ ok: false, error: String(err) }))
            }
          })
        })
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        'lorebook-editor': 'lorebook-editor.html',
      },
    },
  },
})
