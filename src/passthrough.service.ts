import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { Env } from "./env"

@Injectable()
export class PassthroughService {
  constructor(protected readonly config: ConfigService<Env>) {}

  async transfer(request: Request): Promise<Response> {
    // Fire a fetch request to the actual api.
    const url = new URL(request.url, this.config.get("LUNCHFLOW_API_HOST"))

    return fetch(url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    })
  }
}
