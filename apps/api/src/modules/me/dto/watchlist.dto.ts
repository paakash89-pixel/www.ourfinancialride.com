import { IsIn, IsString, Length } from "class-validator";
import type { Region } from "@intrinsic/shared";

export class WatchlistDto {
  @IsString()
  @Length(1, 20)
  ticker!: string;

  @IsIn(["US", "IN"])
  region!: Region;
}
