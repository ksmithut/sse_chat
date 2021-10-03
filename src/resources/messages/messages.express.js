import express from 'express'
import { renderEvent } from '../../lib/server-sent-events.js'

/**
 * @param {object} params
 * @param {import('../../lib/server-sent-events').SSEManager} params.sseManager
 * @param {import('./messages.service').MessagesService} params.messages
 */
export function configureMessagesRouter ({ sseManager, messages }) {
  const router = express.Router()

  router.get('/', (req, res, next) => {
    sseManager.init(res)
    const lastEventId = req.get('Last-Event-ID')
    const unsubscribe = messages.subscribe(lastEventId, message => {
      renderEvent(res, {
        id: message.id,
        event: 'message',
        data: JSON.stringify(message)
      })
      // res.write(`id: ${message.id}\n`)
      // res.write('event: message\n')
      // res.write(`data: ${JSON.stringify(message)}\n`)
      // res.write('\n')
    })
    res.on('close', unsubscribe)
  })

  router.post('/', express.text(), (req, res, next) => {
    const { body } = req
    if (typeof body !== 'string') {
      return res.status(400).json({ code: 'INVALID_BODY_TYPE' })
    }
    if (!body.trim()) {
      return res.status(400).json({ code: 'EMPTY_BODY' })
    }
    const messageId = messages.sendMessage(body)
    res.status(201).end(messageId)
  })

  return router
}
