import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min
} from "class-validator";

export class CreatePccDto {
  @IsOptional()
  @IsIn(["US", "IN"])
  region?: "US" | "IN";

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  horizonYears?: number;

  @IsIn([20, 40, 60])
  maxDrawdownTolerance!: 20 | 40 | 60;

  @IsString()
  @Length(10, 1000)
  thesisHowMoney!: string;

  @IsString()
  @Length(10, 1000)
  thesisWhyWin10Years!: string;

  @IsString()
  @Length(10, 1000)
  thesisBreaksPermanently!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  breakConditionChecks!: string[];

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  breakConditionNotes?: string;
}
