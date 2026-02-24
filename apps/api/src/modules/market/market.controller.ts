import { Controller, Get, Query } from "@nestjs/common";
import { Public } from "../../common/public.decorator";
import { StressQueryDto } from "./dto/stress-query.dto";
import { MarketService } from "./market.service";

@Controller("market")
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get("stress")
  @Public()
  getStress(@Query() query: StressQueryDto) {
    return this.marketService.getStressStatus(query.region ?? "US");
  }

  @Get("community")
  @Public()
  community() {
    return this.marketService.getCommunitySnapshot();
  }
}
