/**
 * @typedef {ReturnType<createSSEManager>} SSEManager
 */

export function createSSEManager () {
  /** @type {Set<import('http').ServerResponse>} */
  const resSet = new Set()

  return {
    /**
     * @param {import('http').ServerResponse} res
     */
    init (res) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache'
      })
      resSet.add(res)
      res.on('close', () => {
        resSet.delete(res)
      })
    },
    close () {
      resSet.forEach(res => {
        res.end()
        res.req.destroy()
      })
      resSet.clear()
    }
  }
}

/**
 * @param {string} string
 */
function clean (string) {
  return string.replaceAll('\n', '')
}

/**
 * @typedef {object} ServerSentEvent
 * @property {string} [id]
 * @property {string} [event]
 * @property {number} [retry]
 * @property {string} [data]
 * @property {string} [comment]
 */

/**
 * @param {import('http').ServerResponse} res
 * @param {ServerSentEvent} event
 */
export function renderEvent (res, { id, event, retry, data, comment }) {
  if (id) res.write(`id: ${clean(id)}\n`)
  if (event) res.write(`event: ${clean(event)}\n`)
  if (retry != null) res.write(`retry: ${retry}\n`)
  if (data) {
    for (const line of data.split('\n')) res.write(`data: ${clean(line)}\n`)
  }
  if (comment) {
    for (const line of comment.split('\n')) res.write(`: ${clean(line)}\n`)
  }
  res.write('\n')
}
