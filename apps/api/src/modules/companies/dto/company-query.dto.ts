import { IsIn, IsOptional, IsString } from "class-validator";
import type { Region } from "@intrinsic/shared";

export class CompanyQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(["US", "IN"])
  region?: Region;
}
