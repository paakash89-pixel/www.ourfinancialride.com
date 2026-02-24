import { IsBoolean, IsEmail, IsIn, IsOptional, IsString } from "class-validator";
import type { Region } from "@intrinsic/shared";

export class UpdateProfileDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsIn(["US", "IN"])
  region?: Region;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  disclaimerAccepted?: boolean;

  @IsOptional()
  @IsBoolean()
  privateMode?: boolean;

  @IsOptional()
  @IsBoolean()
  aiMemoryOptIn?: boolean;

  @IsOptional()
  @IsIn(["BALANCED", "FOCUSED", "EXTREME"])
  concentrationLabel?: "BALANCED" | "FOCUSED" | "EXTREME";

  @IsOptional()
  @IsBoolean()
  concentrationAcknowledged?: boolean;
}
