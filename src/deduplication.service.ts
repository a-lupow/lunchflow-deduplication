import { Inject, Injectable, Logger } from "@nestjs/common"
import { eq } from "drizzle-orm"
import z from "zod"
import { Database } from "./db"
import { deduplicatedTransactions } from "./db/schema"

const ExpectedTransactionSchema = z.object({
  id: z.string(),
  accountId: z.number(),
  amount: z.number(),
  currency: z.string(),
  date: z.string(),
  merchant: z.string(),
  description: z.string(),
  isPending: z.boolean(),
})

type ExpectedTransaction = z.infer<typeof ExpectedTransactionSchema>

const ExpectedTransactionsResponse = z.object({
  transactions: z.array(ExpectedTransactionSchema),
})

const extractTransactionId = (transaction: ExpectedTransaction) => {
  const match = transaction.description.match(/id:(\w+)/i)

  return match ? match[1] : null
}

@Injectable()
export class DeduplicationService {
  protected readonly logger = new Logger(DeduplicationService.name)

  constructor(@Inject(Database) protected readonly db: Database) {}

  /**
   * Deduplicates transactions response.
   *
   * @param response
   *   Raw response from the API.
   *   Expected to have deduplication ids (transaction id) in the description for each item.
   */
  async deduplicateResponse(response: unknown) {
    if (typeof response !== "object" || response === null) {
      throw new Error("Invalid response format: expected an object")
    }

    const validSchema = ExpectedTransactionsResponse.parse(response)

    const transactionMap = validSchema.transactions.reduce((map, item) => {
      const transactionId = extractTransactionId(item)

      if (!map.has(transactionId)) {
        map.set(transactionId, [item])
      } else {
        map.get(transactionId)?.push(item)
      }

      return map
    }, new Map<string | null, ExpectedTransaction[]>())

    const deduplicationMap = new Map<string, string>()

    // For each transaction id we make sure we only return the most recent one or the one in db.
    for (const [transactionId, transactions] of transactionMap.entries()) {
      if (transactionId === null) {
        this.logger.warn(
          `Transaction with ids ${transactions.map((transaction) => transaction.id).join(",")} does not have a valid transaction id in the description, skipping deduplication for this item.`,
        )

        continue
      }

      const deduplicatedId = await this.db.query.deduplicatedTransactions.findFirst({
        where: eq(deduplicatedTransactions.transactionId, transactionId),
      })

      if (deduplicatedId) {
        this.logger.debug(
          `Found deduplicated transaction for id ${transactionId}, will use record id ${deduplicatedId.recordId}`,
        )

        deduplicationMap.set(transactionId, deduplicatedId.recordId)
      } else {
        const newDeduplicationId = transactions[0].id

        // Use the most recent one that is available.
        await this.db
          .insert(deduplicatedTransactions)
          .values({
            transactionId,
            recordId: newDeduplicationId,
          })
          .onConflictDoUpdate({
            target: deduplicatedTransactions.transactionId,
            set: {
              recordId: newDeduplicationId,
            },
          })

        deduplicationMap.set(transactionId, newDeduplicationId)
      }
    }

    const transactions = validSchema.transactions.filter((item) => {
      const transactionId = extractTransactionId(item)

      if (transactionId === null) {
        return true
      }

      const deduplicatedId = deduplicationMap.get(transactionId)
      const isDeduplicated = item.id !== deduplicatedId

      if (isDeduplicated) {
        this.logger.debug(
          `Transaction ${item.id} is deduplicated, will use record id ${deduplicatedId}`,
        )
      }

      return !isDeduplicated
    })

    this.logger.log(
      `Deduplicated transactions: ${transactions.length} items returned out of ${validSchema.transactions.length} original items.`,
    )

    return {
      ...response,
      transactions,
      total: transactions.length,
    }
  }
}
