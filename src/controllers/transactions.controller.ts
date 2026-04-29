import { Controller, Get, Req, Res } from "@nestjs/common"
import type { Response } from "express"
import { DeduplicationService } from "src/deduplication.service"
import { PassthroughService } from "src/passthrough.service"

@Controller("api/v1/accounts/:accountId")
export class TransactionsContrller {
  constructor(
    protected readonly passthrough: PassthroughService,
    protected readonly deduplication: DeduplicationService,
  ) {}

  @Get("transactions")
  async getTransactions(@Req() request: Request, @Res() response: Response) {
    const upstreamResponse = await this.passthrough.transfer(request)
    const json = await upstreamResponse.json()

    if (upstreamResponse.status !== 200) {
      return response.status(upstreamResponse.status).json(json)
    }

    return response
      .status(upstreamResponse.status)
      .json(await this.deduplication.deduplicateResponse(json))
  }
}
