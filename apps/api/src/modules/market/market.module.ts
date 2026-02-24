import { Module } from "@nestjs/common";
import { ProvidersModule } from "../providers/providers.module";
import { MarketController } from "./market.controller";
import { MarketService } from "./market.service";

@Module({
  imports: [ProvidersModule],
  controllers: [MarketController],
  providers: [MarketService],
  exports: [MarketService]
})
export class MarketModule {}
