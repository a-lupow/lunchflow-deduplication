import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core"
import { ZodSerializerInterceptor, ZodValidationPipe } from "nestjs-zod"
import { AppController } from "./app.controller"
import { TransactionsContrller } from "./controllers/transactions.controller"
import { createDatabase, Database } from "./db"
import { DeduplicationService } from "./deduplication.service"
import { Env, validate } from "./env"
import { PassthroughService } from "./passthrough.service"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
  ],
  controllers: [TransactionsContrller, AppController],
  providers: [
    PassthroughService,
    DeduplicationService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: Database,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env>) => {
        return createDatabase(config)
      },
    },
  ],
})
export class AppModule {}
