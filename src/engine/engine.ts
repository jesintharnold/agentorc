import { getjobbyID } from './datastore/dbengine'
import { Postgres } from './datastore/postgres'

console.log('Creating the engine')
console.info('Connecting to Postres')
const A = Postgres.getInstance()
A.testConnection()
setTimeout(async () => {
  console.info('Running the Query DB job Insert')
  // const job = {
  //   name: 'jesinth',
  //   description: 'Cat',
  //   tasks: JSON.stringify({ name: 'jesinth' }),
  //   status: 'PENDING',
  //   image: 'ubuntu',
  //   execorder: ['A', 'B']
  // }
  const B = await getjobbyID('2f9df1e7-3c30-4894-8674-880e5081df7c')
  console.log(B)
}, 3000)
