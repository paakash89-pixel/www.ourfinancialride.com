import { Controller, Get, Param, Query } from "@nestjs/common";
import type { Region } from "@intrinsic/shared";
import { CurrentUser, type AuthUser } from "../../common/current-user.decorator";
import { Public } from "../../common/public.decorator";
import { CompaniesService } from "./companies.service";
import { CompanyQueryDto } from "./dto/company-query.dto";

@Controller("companies")
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get("search")
  @Public()
  search(@Query() query: CompanyQueryDto) {
    return this.companiesService.searchCompanies(query);
  }

  @Get(":ticker/financials")
  financials(
    @CurrentUser() user: AuthUser,
    @Param("ticker") ticker: string,
    @Query("region") region?: Region
  ) {
    return this.companiesService.getCompanyFinancials({ user, ticker, region });
  }

  @Get(":ticker/score")
  score(
    @CurrentUser() user: AuthUser,
    @Param("ticker") ticker: string,
    @Query("region") region?: Region,
    @Query("score_version") scoreVersion?: string
  ) {
    return this.companiesService.getCompanyScore({ user, ticker, region, scoreVersion });
  }
}
