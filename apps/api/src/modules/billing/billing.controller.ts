import { Body, Controller, Headers, Post, UnauthorizedException } from "@nestjs/common";
import { Public } from "../../common/public.decorator";
import { BillingService } from "./billing.service";

@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post(["revenuecat/webhook", "webhooks/revenuecat"])
  @Public()
  async revenueCat(
    @Body() payload: Record<string, unknown>,
    @Headers("x-webhook-secret") secret?: string
  ): Promise<{ ok: true }> {
    if (process.env.RC_WEBHOOK_SECRET && secret !== process.env.RC_WEBHOOK_SECRET) {
      throw new UnauthorizedException("Invalid RevenueCat webhook secret");
    }

    return this.billingService.handleRevenueCatWebhook(payload);
  }
}
