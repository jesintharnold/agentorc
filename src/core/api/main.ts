import express from 'express'
import { logger } from '../../logger/logger'
import { AddressInfo } from 'net'
import { jobengineroute, taskengineroute } from './route'
import { initEngine } from '../engine'
import bodyParser from 'body-parser'
import { DockerRuntime } from '../../runtime/docker/docker'
import { STATUS } from '../../interfaces/enginecore'
// const server: express.Application = express()
// server.use(bodyParser.text({ type: ['application/yaml', 'text/yaml', 'application/x-yaml'] }))
// server.use(express.json())
// server.use('/jobs', jobengineroute)
// server.use('/tasks', taskengineroute)

// const PORT = 5005
// const app = server.listen(PORT, async () => {
//   await initEngine() //creating a Initalizer for Engine coordinator
//   const address = app.address()
//   if (address && typeof address !== 'string') {
//     const netObj: AddressInfo = address
//     const port: number = netObj.port
//     const hostname: string = netObj.address
//     logger.info(`Engine API started and running in ${hostname}${port}`)
//   } else {
//     logger.info('Engine API started but address is not available')
//   }
// })

//PENDING - Global error handling is pending here bro

async function test() {
  const docker = DockerRuntime.getInstance()
  await docker.testConntection()
  const A = await docker.runTask({
    image: 'nginx:latest',
    env: { A: '1', B: '2', 'TASK-ID': '001' },
    script: 'for i in {1..10}; do echo "$i. hello world"; done; exit 1'
  })
  console.log(A)
}

test()
