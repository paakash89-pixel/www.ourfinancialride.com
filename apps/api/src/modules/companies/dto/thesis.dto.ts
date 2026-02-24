import { IsString, MinLength } from "class-validator";

export class ThesisDto {
  @IsString()
  @MinLength(10)
  content!: string;
}
