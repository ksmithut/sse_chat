import process from 'node:process'
import { start } from '../index.js'

const { PORT = '3000' } = process.env

start({ port: Number(PORT) })
  .then(close => {
    let shuttingDown = false
    function shutDown () {
      if (shuttingDown) return
      shuttingDown = true
      close()
        .then(() => process.exit())
        .catch(error => {
          console.error(error)
          process.exit(1)
        })
    }
    process.on('SIGINT', shutDown)
    process.on('SIGTERM', shutDown)
    process.on('SIGUSR2', shutDown)
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
