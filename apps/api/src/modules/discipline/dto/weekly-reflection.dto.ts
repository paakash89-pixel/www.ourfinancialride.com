import { IsString, Length } from "class-validator";

export class WeeklyReflectionDto {
  @IsString()
  @Length(5, 280)
  prompt!: string;

  @IsString()
  @Length(10, 4000)
  responseText!: string;
}
