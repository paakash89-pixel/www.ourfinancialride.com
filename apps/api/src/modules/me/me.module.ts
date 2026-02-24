import { Module } from "@nestjs/common";
import { MeController } from "./me.controller";
import { MeService } from "./me.service";
import { BillingModule } from "../billing/billing.module";

@Module({
  imports: [BillingModule],
  controllers: [MeController],
  providers: [MeService],
  exports: [MeService]
})
export class MeModule {}
