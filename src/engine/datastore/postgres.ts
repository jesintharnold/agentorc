/* eslint-disable @typescript-eslint/no-explicit-any */
import postgres from 'postgres'

export class Postgres {
  private postgrescon: postgres.Sql<any>
  private static postgresSingleton: Postgres
  constructor() {
    this.postgrescon = postgres()
  }

  public static getInstance(): Postgres {
    if (!this.postgresSingleton) {
      this.postgresSingleton = new Postgres()
    }
    return this.postgresSingleton
  }
}
