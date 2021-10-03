import { randomUUID } from 'node:crypto'

/**
 * @typedef {object} Message
 * @property {string} id
 * @property {string} text
 * @property {number} timestamp
 */

/**
 * @callback MessageCallback
 * @param {Message} message
 * @returns {void}
 */

/**
 * @typedef {ReturnType<configureMessagesService>} MessagesService
 */

export function configureMessagesService () {
  /** @type {Message[]} */
  const messages = []
  /** @type {Set<MessageCallback>} */
  const listeners = new Set()

  return {
    /**
     * @param {import('http').ServerResponse} res
     * @param {string|undefined} lastEventId
     * @param {MessageCallback} onMessage
     */
    subscribe (lastEventId, onMessage) {
      let start = -1
      if (lastEventId) {
        start = messages.findIndex(message => message.id === lastEventId)
      }
      for (let i = start + 1; i < messages.length; i++) onMessage(messages[i])
      listeners.add(onMessage)
      return () => {
        listeners.delete(onMessage)
      }
    },
    /**
     * @param {string} text
     */
    sendMessage (text) {
      const message = { id: randomUUID(), text, timestamp: Date.now() }
      messages.push(message)
      while (messages.length > 100) messages.shift()
      listeners.forEach(onMessage => onMessage(message))
      return message.id
    },
    close () {
      listeners.clear()
    }
  }
}
