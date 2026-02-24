import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { CurrentUser, type AuthUser } from "../../common/current-user.decorator";
import { MeService } from "./me.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { DeleteRequestDto } from "./dto/delete-request.dto";
import { WatchlistDto } from "./dto/watchlist.dto";

@Controller("me")
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get("profile")
  getProfile(@CurrentUser() user: AuthUser) {
    return this.meService.getProfile(user);
  }

  @Put("profile")
  updateProfile(@CurrentUser() user: AuthUser, @Body() body: UpdateProfileDto) {
    return this.meService.updateProfile(user, body);
  }

  @Get("entitlements")
  getEntitlements(@CurrentUser() user: AuthUser) {
    return this.meService.getEntitlements(user);
  }

  @Get("watchlist")
  watchlist(@CurrentUser() user: AuthUser) {
    return this.meService.getWatchlist(user);
  }

  @Get("pccs")
  pccs(@CurrentUser() user: AuthUser) {
    return this.meService.getPccContracts(user);
  }

  @Post("watchlist")
  addWatchlist(@CurrentUser() user: AuthUser, @Body() body: WatchlistDto) {
    return this.meService.addWatchlist(user, body);
  }

  @Delete("watchlist/:ticker")
  removeWatchlist(@CurrentUser() user: AuthUser, @Param("ticker") ticker: string) {
    return this.meService.removeWatchlist(user, ticker);
  }

  @Post("export")
  exportUserData(@CurrentUser() user: AuthUser) {
    return this.meService.exportData(user);
  }

  @Post("delete")
  deleteData(@CurrentUser() user: AuthUser, @Body() body: DeleteRequestDto) {
    return this.meService.deleteData(user, body);
  }
}
