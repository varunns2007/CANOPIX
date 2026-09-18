import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import https from 'node:https'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'fast2sms-live-proxy',
      configureServer(server) {
        server.middlewares.use('/api/fast2sms', (req, res) => {
          if (req.method === 'POST') {
            let body = ''
            req.on('data', (chunk) => {
              body += chunk
            })
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body)
                const payload = JSON.stringify({
                  route: 'q',
                  message: parsed.message,
                  language: 'english',
                  flash: 0,
                  numbers: parsed.numbers,
                })

                const options = {
                  hostname: 'www.fast2sms.com',
                  port: 443,
                  path: '/dev/bulkV2',
                  method: 'POST',
                  headers: {
                    authorization: parsed.authorization,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                  },
                }

                const apiReq = https.request(options, (apiRes) => {
                  let apiData = ''
                  apiRes.on('data', (chunk) => {
                    apiData += chunk
                  })
                  apiRes.on('end', () => {
                    res.setHeader('Content-Type', 'application/json')
                    res.statusCode = apiRes.statusCode || 200
                    res.end(apiData)
                  })
                })

                apiReq.on('error', (err) => {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ return: false, message: err.message }))
                })

                apiReq.write(payload)
                apiReq.end()
              } catch (e: any) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ return: false, message: 'Invalid payload' }))
              }
            })
          }
        })
      },
    },
  ],
})
