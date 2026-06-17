import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
const app = express()

app.get('/api/status/healthz', (req, res) => {
    res.status(200).send('healthy ')
})
app.get('/api/status/readyz', (req, res) => {
    res.status(200).send('ready')
})

const proxies = {}
function getProxy(sandboxId) {
    if (!proxies[sandboxId]) {
        proxies[sandboxId] = createProxyMiddleware({
            target: `http://sandbox-service-${sandboxId}`,
            changeOrigin: true,
            ws: true,
        })

    }
    return proxies[sandboxId]
}



app.use((req, res, next) => {
    const host = req.headers.host
    const sandboxId = host.split('.')[0]
    const target = `http://sandbox-service-${sandboxId}`

   return getProxy(sandboxId)(req, res, next)
})

export default app