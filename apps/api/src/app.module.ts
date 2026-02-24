import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { BullModule } from "@nestjs/bullmq";
import { FirebaseAuthGuard } from "./common/firebase-auth.guard";
import { PrismaModule } from "./common/prisma.module";
import { MeModule } from "./modules/me/me.module";
import { BillingModule } from "./modules/billing/billing.module";
import { ProvidersModule } from "./modules/providers/providers.module";
import { JobsModule } from "./modules/jobs/jobs.module";
import { MarketModule } from "./modules/market/market.module";
import { OwnedModule } from "./modules/owned/owned.module";
import { DisciplineModule } from "./modules/discipline/discipline.module";
import { CompaniesModule } from "./modules/companies/companies.module";

const enableJobs = process.env.INTRINSIC_ENABLE_JOBS === "true";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"]
    }),
    ScheduleModule.forRoot(),
    ...(enableJobs
      ? [
          BullModule.forRoot({
            connection: {
              url: process.env.REDIS_URL ?? "redis://localhost:6379"
            }
          })
        ]
      : []),
    PrismaModule,
    ProvidersModule,
    BillingModule,
    MeModule,
    MarketModule,
    CompaniesModule,
    OwnedModule,
    DisciplineModule,
    ...(enableJobs ? [JobsModule] : [])
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: FirebaseAuthGuard
    }
  ]
})
export class AppModule {}
