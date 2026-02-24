import { Module } from "@nestjs/common";
import { JobsService } from "./jobs.service";
import { MarketModule } from "../market/market.module";
import { DisciplineModule } from "../discipline/discipline.module";

@Module({
  imports: [MarketModule, DisciplineModule],
  providers: [JobsService]
})
export class JobsModule {}
