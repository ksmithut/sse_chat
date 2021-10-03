import test from 'tape'
import EventSource from 'eventsource'
import fetch from 'node-fetch'
import { start } from '../src/index.js'

test('message app', async t => {
  const port = 3001
  const origin = `http://localhost:${port}`
  const close = await start({ port })
  t.teardown(() => close())

  await t.test('Can send a message', t => {
    let messageId
    const es = new EventSource(`${origin}/messages`)
    const now = Date.now()
    es.addEventListener('message', event => {
      const then = Date.now()
      es.close()
      t.equals(event.lastEventId, messageId, 'lastEventId')
      t.equals(event.type, 'message', 'message')
      const data = JSON.parse(event.data)
      t.equals(data.id, messageId, 'data.id')
      t.equals(data.text, 'Hello there', 'data.text')
      t.assert(
        now <= data.timestamp && data.timestamp <= then,
        'data.timestamp'
      )
      t.end()
    })
    fetch(`${origin}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'Hello there'
    })
      .then(async res => {
        t.equals(res.status, 201)
        messageId = await res.text()
      })
      .catch(t.end)
  })

  t.end()
})
