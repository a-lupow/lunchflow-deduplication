import z from "zod"

const EnvSchema = z.object({
  LUNCHFLOW_API_HOST: z.string().default("https://www.lunchflow.app"),
  DB_URL: z.string(),
})

export type Env = z.infer<typeof EnvSchema>

export const validate = EnvSchema.parse
