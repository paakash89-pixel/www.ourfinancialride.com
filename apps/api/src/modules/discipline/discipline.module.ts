import { Module } from "@nestjs/common";
import { MarketModule } from "../market/market.module";
import { MeModule } from "../me/me.module";
import { ProvidersModule } from "../providers/providers.module";
import { DisciplineController } from "./discipline.controller";
import { DisciplineService } from "./discipline.service";

@Module({
  imports: [MeModule, ProvidersModule, MarketModule],
  controllers: [DisciplineController],
  providers: [DisciplineService],
  exports: [DisciplineService]
})
export class DisciplineModule {}
