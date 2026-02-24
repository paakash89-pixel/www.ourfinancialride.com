import { BadRequestException, Injectable } from "@nestjs/common";
import type { EntitlementPlan, Region } from "@intrinsic/shared";
import { EntitlementsService } from "./entitlements.service";

const parsePlan = (raw: string | undefined): EntitlementPlan =>
  raw?.toLowerCase().includes("owner") || raw?.toLowerCase().includes("pro")
    ? "OWNER"
    : "EXPLORER";

const parseRegion = (raw: string | undefined): Region => (raw === "IN" ? "IN" : "US");

@Injectable()
export class BillingService {
  constructor(private readonly entitlements: EntitlementsService) {}

  async handleRevenueCatWebhook(payload: Record<string, unknown>): Promise<{ ok: true }> {
    const event = payload.event as Record<string, unknown> | undefined;
    const userId =
      (event?.app_user_id as string | undefined) ??
      (payload.userId as string | undefined) ??
      undefined;

    if (!userId) {
      throw new BadRequestException("RevenueCat payload missing user id");
    }

    await this.entitlements.applyEntitlementEvent({
      userId,
      plan: parsePlan((event?.product_id as string | undefined) ?? "explorer"),
      source: "REVENUECAT",
      region: parseRegion((event?.country_code as string | undefined) ?? "US"),
      expiresAt: event?.expiration_at_ms
        ? new Date(Number(event.expiration_at_ms)).toISOString()
        : undefined,
      status: (event?.type as string | undefined)?.includes("CANCEL")
        ? "INACTIVE"
        : "ACTIVE"
    });

    return { ok: true };
  }
}
