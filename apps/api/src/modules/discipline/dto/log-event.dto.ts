import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min
} from "class-validator";

export class LogEventDto {
  @IsIn(["START", "COMPLETE"])
  action!: "START" | "COMPLETE";

  @IsString()
  @Length(1, 20)
  ticker!: string;

  @IsOptional()
  @IsIn(["US", "IN"])
  region?: "US" | "IN";

  @IsOptional()
  @IsString()
  cooldownSessionId?: string;

  @IsOptional()
  @IsIn(["PANIC_SELL_SIMULATED", "HELD"])
  type?: "PANIC_SELL_SIMULATED" | "HELD";

  @IsOptional()
  @IsString()
  @Length(8, 120)
  clientEventId?: string;

  @IsOptional()
  @IsString()
  @Length(10, 2000)
  reasonText?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.000001)
  priceAtEvent?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1_000_000_000)
  notional?: number;

  @IsOptional()
  @IsString()
  timestampOverride?: string;
}
