import { createServer } from 'node:http'
import { promisify } from 'node:util'
import { once } from 'node:events'
import express from 'express'
import { createSSEManager } from './lib/server-sent-events.js'
import { configureMessagesRouter } from './resources/messages/messages.express.js'

const STATIC_DIR = new URL('./static/', import.meta.url).pathname

/**
 * @param {object} params
 * @param {import('./resources/messages/messages.service').MessagesService} params.messages
 */
export function configureServer ({ messages }) {
  const app = express()
  const sseManager = createSSEManager()
  const messagesRouter = configureMessagesRouter({
    sseManager,
    messages
  })

  app.disable('x-powered-by')
  app.use(express.static(STATIC_DIR))
  app.use('/messages', messagesRouter)

  /**
   * @param {number} port
   */
  return async port => {
    const server = createServer(app)
    const closeServer = promisify(server.close.bind(server))
    await once(server.listen(port), 'listening')
    return async () => {
      sseManager.close()
      await closeServer()
    }
  }
}
