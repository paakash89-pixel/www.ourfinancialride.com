import { IsIn, IsOptional } from "class-validator";

export class DeleteRequestDto {
  @IsOptional()
  @IsIn(["account", "chat"])
  scope?: "account" | "chat";
}
