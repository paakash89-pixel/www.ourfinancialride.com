import { IsIn, IsOptional } from "class-validator";

export class StressQueryDto {
  @IsOptional()
  @IsIn(["US", "IN"])
  region?: "US" | "IN";
}
