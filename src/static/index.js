const messages = document.getElementById('messages')
if (!(messages instanceof window.HTMLDivElement)) {
  throw new Error('invalid #messages element')
}

const form = document.getElementById('input-form')
if (!(form instanceof window.HTMLFormElement)) {
  throw new Error('invalid #input-form element')
}

form.addEventListener('submit', event => {
  event.preventDefault()
  const textInput = form.elements.namedItem('text')
  if (!(textInput instanceof window.HTMLInputElement)) return
  if (!textInput.value.trim()) return
  window.fetch('/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: textInput.value
  })
  textInput.value = ''
})

const appendMessage = messages.appendChild.bind(messages)

/**
 * @param {object} data
 * @param {string} data.text
 * @param {number} data.timestamp
 */
function renderMessage ({ text, timestamp }) {
  const date = new Date(timestamp).toLocaleString()
  const message = document.createElement('p')
  message.textContent = `${date}:\t${text}`
  message.classList.add('message')
  appendMessage(message)
}

const eventSource = new window.EventSource('/messages', {
  withCredentials: true
})
eventSource.addEventListener('message', event => {
  renderMessage(JSON.parse(event.data))
})

export {}
