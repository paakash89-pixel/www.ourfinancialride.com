import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Region } from "@intrinsic/shared";
import { PrismaService } from "../../common/prisma.service";
import { devStore } from "../../common/dev-store";
import type { AuthUser } from "../../common/current-user.decorator";
import { EntitlementsService } from "../billing/entitlements.service";
import { MeService } from "../me/me.service";
import type { CreatePccDto } from "./dto/create-pcc.dto";

const sanitizeTicker = (raw: string): string =>
  raw
    .toUpperCase()
    .replace(/[^A-Z0-9.-]/g, "")
    .slice(0, 20);

const toChecks = (items: string[]): string[] =>
  items
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 32);

const normalizeText = (value: string): string => value.trim().replace(/\s+/g, " ");

@Injectable()
export class OwnedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly meService: MeService,
    private readonly entitlements: EntitlementsService
  ) {}

  async createPcc(params: {
    user: AuthUser;
    ticker: string;
    payload: CreatePccDto;
  }) {
    const profile = await this.meService.getOrCreateProfile(params.user);
    const region = (params.payload.region ?? profile.region) as Region;
    const ticker = sanitizeTicker(params.ticker);
    const checks = toChecks(params.payload.breakConditionChecks);
    const thesisHowMoney = normalizeText(params.payload.thesisHowMoney);
    const thesisWhyWin10Years = normalizeText(params.payload.thesisWhyWin10Years);
    const thesisBreaksPermanently = normalizeText(params.payload.thesisBreaksPermanently);
    const breakConditionNotes = params.payload.breakConditionNotes
      ? normalizeText(params.payload.breakConditionNotes)
      : undefined;

    if (!ticker) {
      throw new BadRequestException("Ticker is required");
    }
    if (thesisHowMoney.length < 10) {
      throw new BadRequestException("How it makes money must be at least 10 characters");
    }
    if (thesisWhyWin10Years.length < 10) {
      throw new BadRequestException("10-year win thesis must be at least 10 characters");
    }
    if (thesisBreaksPermanently.length < 10) {
      throw new BadRequestException("Break thesis must be at least 10 characters");
    }
    if (checks.length < 1) {
      throw new BadRequestException("At least one break condition is required");
    }

    if (!this.prisma.isConnected()) {
      const existingForTicker = devStore.pccContracts
        .filter(
          (item) =>
            item.userId === params.user.uid && item.ticker === ticker && item.region === region
        )
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      const uniqueOwned = new Set(
        devStore.pccContracts
          .filter((item) => item.userId === params.user.uid)
          .map((item) => `${item.region}:${item.ticker}`)
      );

      if (!existingForTicker.length) {
        await this.entitlements.ensureOwnedCanAdd({
          userId: params.user.uid,
          region,
          currentCount: uniqueOwned.size
        });
      }

      const root = existingForTicker[0];
      const record = {
        id: devStore.makeId("pcc"),
        userId: params.user.uid,
        ticker,
        region,
        horizonYears: params.payload.horizonYears ?? 10,
        maxDrawdownTolerance: params.payload.maxDrawdownTolerance,
        thesisHowMoney,
        thesisWhyWin10Years,
        thesisBreaksPermanently,
        breakConditionChecks: checks,
        breakConditionNotes,
        originId: root ? root.originId ?? root.id : undefined,
        version: existingForTicker.length + 1,
        immutable: true,
        reviewedAt: undefined,
        createdAt: new Date()
      };

      devStore.pccContracts.push(record);
      return record;
    }

    const [existingForTicker, uniqueOwned] = await Promise.all([
      this.prisma.pccContract.findMany({
        where: { userId: params.user.uid, ticker, region },
        orderBy: { createdAt: "asc" }
      }),
      this.prisma.pccContract.findMany({
        where: { userId: params.user.uid },
        distinct: ["ticker", "region"],
        select: { ticker: true, region: true }
      })
    ]);

    if (!existingForTicker.length) {
      await this.entitlements.ensureOwnedCanAdd({
        userId: params.user.uid,
        region,
        currentCount: uniqueOwned.length
      });
    }

    const root = existingForTicker[0];
    return this.prisma.pccContract.create({
      data: {
        userId: params.user.uid,
        ticker,
        region,
        horizonYears: params.payload.horizonYears ?? 10,
        maxDrawdownTolerance: params.payload.maxDrawdownTolerance,
        thesisHowMoney,
        thesisWhyWin10Years,
        thesisBreaksPermanently,
        breakConditionChecks: checks,
        breakConditionNotes: breakConditionNotes ?? null,
        originId: root ? root.originId ?? root.id : null,
        version: existingForTicker.length + 1,
        immutable: true
      }
    });
  }

  async getPcc(params: {
    user: AuthUser;
    ticker: string;
    region?: Region;
  }) {
    const profile = await this.meService.getOrCreateProfile(params.user);
    const region = (params.region ?? profile.region) as Region;
    const ticker = sanitizeTicker(params.ticker);

    const rows = !this.prisma.isConnected()
      ? devStore.pccContracts
          .filter(
            (item) =>
              item.userId === params.user.uid && item.ticker === ticker && item.region === region
          )
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      : await this.prisma.pccContract.findMany({
          where: { userId: params.user.uid, ticker, region },
          orderBy: { createdAt: "asc" }
        });

    if (!rows.length) {
      throw new NotFoundException("No PCC found for this ticker");
    }

    const original = rows.find((item) => !item.originId) ?? rows[0];
    const latest = rows[rows.length - 1];

    return {
      ticker,
      region,
      original,
      latest,
      versions: rows
    };
  }
}
