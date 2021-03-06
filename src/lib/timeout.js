import { setTimeout as wait } from 'timers/promises'

export class Timeout extends Error {
  constructor (message = 'timeout', code = 'TIMEOUT_ERROR') {
    super(message)
    Error.captureStackTrace(this, this.constructor)
    this.code = code
  }
}

/**
 * @template TValue
 * @param {Promise<TValue>} promise
 * @param {number} ms
 * @param {object} [options]
 * @param {string} [options.message]
 * @param {string} [options.code]
 * @returns {Promise<TValue>}
 */
export function timeout (promise, ms, { message, code } = {}) {
  const ac = new AbortController()
  return Promise.race([
    promise.then(value => {
      ac.abort()
      return value
    }),
    wait(ms, undefined, { signal: ac.signal }).then(() =>
      Promise.reject(new Timeout(message, code))
    )
  ])
}
