import { IsIn, IsOptional } from "class-validator";

export class PccQueryDto {
  @IsOptional()
  @IsIn(["US", "IN"])
  region?: "US" | "IN";
}
