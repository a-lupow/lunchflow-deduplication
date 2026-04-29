import { All, Controller, Logger, Request, Res } from "@nestjs/common"
import type { Response } from "express"
import { PassthroughService } from "./passthrough.service"

@Controller("*")
export class AppController {
  protected readonly logger = new Logger(AppController.name)

  constructor(private readonly passthrough: PassthroughService) {}

  @All()
  async passthroughAll(
    @Request()
    request: Request,
    @Res()
    response: Response,
  ) {
    this.logger.log(`Received request: ${request.method} ${request.url}`)
    const passthrough = await this.passthrough.transfer(request)

    response.setHeader(
      "Content-Type",
      passthrough.headers.get("Content-Type") || "application/json",
    )

    return response.status(passthrough.status).send(await passthrough.text())
  }
}
