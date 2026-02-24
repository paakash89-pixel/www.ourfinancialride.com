import { Module } from "@nestjs/common";
import { BillingModule } from "../billing/billing.module";
import { MeModule } from "../me/me.module";
import { OwnedController } from "./owned.controller";
import { OwnedService } from "./owned.service";

@Module({
  imports: [MeModule, BillingModule],
  controllers: [OwnedController],
  providers: [OwnedService],
  exports: [OwnedService]
})
export class OwnedModule {}
