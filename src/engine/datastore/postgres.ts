/* eslint-disable @typescript-eslint/no-explicit-any */
import postgres from 'postgres'

export class Postgres {
  private postgrescon: postgres.Sql<any>
  private static postgresSingleton: Postgres
  constructor() {
    this.postgrescon = postgres({
      host: 'localhost',
      port: 5432,
      database: 'agentorc',
      username: 'postgres',
      password: 'admin',
      idle_timeout: 40,
      max_lifetime: 60 * 30
    })
  }

  public static getInstance(): Postgres {
    if (!this.postgresSingleton) {
      this.postgresSingleton = new Postgres()
    }
    return this.postgresSingleton
  }
  public async testConnection(): Promise<boolean> {
    try {
      await this.postgrescon`select 1`
      console.info('Connected to Postgres')
      return true
    } catch (error: any) {
      console.error(error?.message)
      return false
    }
  }

  public async closeDB(): Promise<boolean> {
    try {
      await this.postgrescon.end()
      return true
    } catch (error: any) {
      console.error(error?.message)
      return false
    }
  }

  public con(): postgres.Sql<any> {
    return this.postgrescon
  }
}
