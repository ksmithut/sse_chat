import { timeout } from './lib/timeout.js'
import { configureMessagesService } from './resources/messages/messages.service.js'
import { configureServer } from './server.js'

/**
 * @param {object} params
 * @param {number} params.port
 */
export async function start ({ port }) {
  const messages = configureMessagesService()
  const startServer = configureServer({ messages })
  const closeServer = await startServer(port)
  console.log(`Server listening on port ${port}`)

  return async () => {
    messages.close()
    await timeout(closeServer(), 6000)
  }
}
