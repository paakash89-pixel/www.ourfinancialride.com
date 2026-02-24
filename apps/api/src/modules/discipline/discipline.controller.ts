import { Body, Controller, Get, Post } from "@nestjs/common";
import { CurrentUser, type AuthUser } from "../../common/current-user.decorator";
import { LogEventDto } from "./dto/log-event.dto";
import { WeeklyReflectionDto } from "./dto/weekly-reflection.dto";
import { DisciplineService } from "./discipline.service";

@Controller()
export class DisciplineController {
  constructor(private readonly disciplineService: DisciplineService) {}

  @Post("events")
  logEvent(@CurrentUser() user: AuthUser, @Body() body: LogEventDto) {
    return this.disciplineService.logEvent({ user, payload: body });
  }

  @Get("me/regret")
  regretLedger(@CurrentUser() user: AuthUser) {
    return this.disciplineService.getRegretLedger(user);
  }

  @Get("me/discipline")
  discipline(@CurrentUser() user: AuthUser) {
    return this.disciplineService.getDisciplineSummary(user);
  }

  @Post("me/discipline/reflection")
  weeklyReflection(@CurrentUser() user: AuthUser, @Body() body: WeeklyReflectionDto) {
    return this.disciplineService.submitWeeklyReflection({
      user,
      prompt: body.prompt,
      responseText: body.responseText
    });
  }
}
