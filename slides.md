---
theme: ./theme.json
author: Keith Smith
paging: Server-Sent Events
size: 102 x 29
---

# Server-Sent Events

<!-- -->

The relatively unknown alternative to WebSockets

---

## What is the problem?

<!-- -->
<!-- -->

> "I made the change on my phone, why doesn't it show my changes on my computer?"

- JIRA ticket PJT-475

<!-- -->
<!-- -->

> "Why isn't the document list showing the newly submitted documents?"

- D. Ziner, Product Manager

<!-- -->
<!-- -->

> "Could we add a notification for when a new approval becomes available?"

- CEO in a passing conversation

---

## What are ways to solve this?

---

## What are ways to solve this?

### Polling

<!-- -->

```js
setInterval(() => {
  fetch('/api/data')
    .then(async res => {
      if (res.status === 502) return
      if (res.status === 200) return rerender(await res.json())
      throw new Error(`Unexpected status: ${res.status}`)
    })
    .catch(error => showError(error))
}, 5000)
```

<!-- -->

- Easiest to implement
- Fetches unnecessary data often
- Can add additional load to your API server

---

## What are ways to solve this?

### Long-Polling

<!-- -->

```js
function longPoll () {
  return fetch('/api/data')
    .then(res => {
      if (res.status === 502) return
      if (res.status === 200) return rerender(await res.json())
      throw new Error(`Unexpected status: ${res.status}`)
    })
    .catch(error => showError(error))
    .then(() => longPoll())
}
```

- Only responds when new data is available
- Requires more implementation on back-end
- Still have overhead of full http request

---

## What are ways to solve this?

### Web-Sockets

<!-- -->
<!-- -->

```js
function connect () {
  const socket = new WebSocket(`wss://${window.location.host}/api/data`)
  socket.onmessage = event => rerender(event.data)
  socket.onclose = () => setTimeout(() => connect(), 5000)
}
```

<!-- -->

- Very efficient, low overhead
- Allows client to send data over same connection
- Have to handle reconnection logic
- Server has to handle upgrading request from HTTP to WebSockets
- WebSocket server implementation often requires library to handle handshake
- WebSocket requests don't go through normal middleware

---

## What are ways to solve this?

### Web-Sockets

```js
import http from 'node:http'
import express from 'express'
import { WebSocketServer } from 'ws'
import authMiddleware from './middleware/auth.js'

const app = express()
const server = http.createServer(app)
const wsServer = new WebSocketServer({ server })

app.use(authMiddleware())
// app.use(...)
wsServer.on('connection', ws => {
  // TODO:: Handle authentication
  ws.on('message', () => {})
  ws.send('something')
})

server.listen(Number.parseInt(process.env.PORT ?? '3000'))
```

---

## What are ways to solve this?

### Server-Sent Events

<!-- -->
<!-- -->
<!-- -->
<!-- -->

```js
const eventSource = new EventSource('/api/data')
eventSource.addEventListener('message', event => rerender(event.data))
```

<!-- -->
<!-- -->
<!-- -->
<!-- -->

- Handles reconnection logic
- Just uses HTTP (is curlable)
- Goes through same middleware stack on the server
- Requires response body to be formatted a specific way

---

## What are ways to solve this?

### Server-Sent Events

```js
// import ...

app.use(authMiddleware())
app.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache'
  })
  const interval = setInterval(() => {
    res.write('data: something\n\n')
  }, 1000)
  res.on('close' => clearInterval(interval))
})

server.listen(Number.parseInt(process.env.PORT ?? '3000'))
```

---

## Limitations of Server-Sent Events

<!-- -->
<!-- -->
<!-- -->
<!-- -->

- Maximum number of concurrent connections
  <!-- -->
- Mono-directional communication
  <!-- -->
- Limited to UTF-8
  <!-- -->
- Not supported in IE11
  <!-- -->
- Cannot set headers in `EventSource` constructor

---

## What are Server-Sent Events good for?

<!-- -->

- [x] Simple Notifications
- [x] Turn-Based Multiplayer Game
- [x] Real-Time Data Dashboard
- [x] Chat Application
- [x] Event Delivery

<!-- -->
<!-- -->
<!-- -->

## What aren't they good for?

<!-- -->

- [ ] Real-Time Multiplayer Game
- [ ] Live Document Editing (a la Google Docs)
- [ ] Messaging requiring binary data or efficient packets
- [ ] Anything requiring lots of simultaneous connections

---

## What do Server-Sent Events actually look like?

---

## What do Server-Sent Events actually look like?

```
HTTP/2 200
Content-Type: text/event-stream
Connection: keep-alive
Cache-Control: no-cache
```

---

## What do Server-Sent Events actually look like?

```
HTTP/2 200
Content-Type: text/event-stream
Connection: keep-alive
Cache-Control: no-cache

id: 1
event: update
retry: 15
data: {"foo":"bar"}
: this is a comment
```

---

## What do Server-Sent Events actually look like?

```
HTTP/2 200
Content-Type: text/event-stream
Connection: keep-alive
Cache-Control: no-cache

id: 1
event: update
retry: 15
data: {"foo":"bar"}
: this is a comment

id: 2
event: notify
data: {"multiline":
data: "value"}
```

---

## What do Server-Sent Events actually look like?

```
HTTP/2 200
Content-Type: text/event-stream
Connection: keep-alive
Cache-Control: no-cache

id: 1
event: update
retry: 15
data: {"foo":"bar"}
: this is a comment

id: 2
event: notify
data: {"multiline":
data: "value"}

id: 3
event: update
data: {"hello":"world"}
```

---

## Example
