import { Postgres } from './datastore/postgres'

console.log('Creating the engine')
console.info('Connecting to Postres')
const A = Postgres.getInstance()
A.testConnection()
setTimeout(() => {
  A.closeDB()
  console.log('connection closed')
}, 3000)
