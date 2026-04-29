import { ConfigService } from "@nestjs/config"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { Env } from "src/env"
import * as schema from "./schema"

export function createDatabase(config: ConfigService<Env>) {
  const sql = postgres(config.getOrThrow("DB_URL"))

  return drizzle(sql, { schema })
}

export const Database = Symbol("database")
export type Database = ReturnType<typeof createDatabase>
