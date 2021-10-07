import http from 'node:http'

const html = str => str[0]

const indexHTML = html`
  <html>
    <head>
      <title>Simple Server-Sent Events</title>
    </head>
    <script type="module">
      const root = document.getElementById('root')
      const eventSource = new EventSource('/stream')
      eventSource.addEventListener('message', event => {
        const child = document.createElement('p')
        child.textContent = event.data
        root.appendChild(child)
      })
    </script>
    <body>
      <div id="root"></div>
    </body>
  </html>
`

/** @type {Map<import('http').ServerResponse, (data: string) => void>} */
const listeners = new Map()

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' }).end(indexHTML)
    return
  }
  if (req.method === 'GET' && req.url === '/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache'
    })
    listeners.set(res, data => res.write(`data: ${data}\n\n`))
    res.on('close', () => listeners.delete(res))
    return
  }
  listeners.forEach(listener => listener(`${req.method} ${req.url}`))
  res.writeHead(200).end()
})

server.listen(3000)

function shutdown () {
  const timeout = setTimeout(() => {
    console.error('server close timeout')
    process.exit(1)
  }, 10000)
  server.close(error => {
    clearTimeout(timeout)
    if (error) {
      console.error(error)
      process.exit(1)
    }
    process.exit(0)
  })
  listeners.forEach((_, res) => {
    res.end()
    res.req.destroy()
  })
  listeners.clear()
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
process.on('SIGUSR2', shutdown)
