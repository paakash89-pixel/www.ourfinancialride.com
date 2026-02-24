import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CurrentUser, type AuthUser } from "../../common/current-user.decorator";
import type { Region } from "@intrinsic/shared";
import { CreatePccDto } from "./dto/create-pcc.dto";
import { PccQueryDto } from "./dto/pcc-query.dto";
import { OwnedService } from "./owned.service";

@Controller("owned")
export class OwnedController {
  constructor(private readonly ownedService: OwnedService) {}

  @Post(":ticker/pcc")
  createPcc(
    @CurrentUser() user: AuthUser,
    @Param("ticker") ticker: string,
    @Body() body: CreatePccDto
  ) {
    return this.ownedService.createPcc({ user, ticker, payload: body });
  }

  @Get(":ticker/pcc")
  getPcc(
    @CurrentUser() user: AuthUser,
    @Param("ticker") ticker: string,
    @Query() query: PccQueryDto
  ) {
    return this.ownedService.getPcc({
      user,
      ticker,
      region: query.region as Region | undefined
    });
  }
}
