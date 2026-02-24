import { Module } from "@nestjs/common";
import { CompaniesController } from "./companies.controller";
import { CompaniesService } from "./companies.service";
import { ProvidersModule } from "../providers/providers.module";
import { MeModule } from "../me/me.module";
import { BillingModule } from "../billing/billing.module";

@Module({
  imports: [ProvidersModule, MeModule, BillingModule],
  controllers: [CompaniesController],
  providers: [CompaniesService]
})
export class CompaniesModule {}
