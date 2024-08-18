import { Postgres } from './postgres'

const connection = Postgres.getInstance().con()

async function createJob() {
  try {
    const data = await connection`
        INSERT INTO orc.jobs(
	        name, description, execorder, tasks)
	        VALUES (?, ?, ?, ?, ?);
        `
    return data
  } catch (error: any) {
    console.error(error)
  }
}
