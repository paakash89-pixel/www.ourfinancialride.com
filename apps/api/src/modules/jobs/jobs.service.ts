import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { Job, Queue, Worker } from "bullmq";
import type { AuthUser } from "../../common/current-user.decorator";
import { PrismaService } from "../../common/prisma.service";
import { devStore } from "../../common/dev-store";
import { DisciplineService } from "../discipline/discipline.service";
import { MarketService } from "../market/market.service";

const QUEUE_NAME = "discipline-jobs";

@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobsService.name);
  private queue?: Queue;
  private worker?: Worker;

  constructor(
    private readonly prisma: PrismaService,
    private readonly marketService: MarketService,
    private readonly disciplineService: DisciplineService
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const connection = { url: process.env.REDIS_URL ?? "redis://localhost:6379" };
      this.queue = new Queue(QUEUE_NAME, { connection });

      this.worker = new Worker(
        QUEUE_NAME,
        async (job: Job) => {
          if (job.name === "refresh-stress") {
            await this.refreshStressStatus();
            return;
          }
          if (job.name === "recompute-discipline") {
            await this.recomputeDiscipline();
            return;
          }
        },
        { connection }
      );

      this.worker.on("failed", (job, error) => {
        this.logger.error(
          `Job ${job?.id ?? "unknown"} failed: ${error.message}`,
          error.stack
        );
      });
    } catch {
      this.logger.warn(
        "Redis unavailable. Scheduled refresh queues are disabled for this dev session."
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
  }

  @Cron("0 1 * * *")
  async enqueueDailyStressRefresh(): Promise<void> {
    if (!this.queue) return;
    await this.queue.add(
      "refresh-stress",
      { triggeredAt: new Date().toISOString() },
      {
        removeOnComplete: true,
        removeOnFail: 10
      }
    );
  }

  @Cron("0 3 * * *")
  async enqueueNightlyDisciplineRecompute(): Promise<void> {
    if (!this.queue) return;
    await this.queue.add(
      "recompute-discipline",
      { triggeredAt: new Date().toISOString() },
      {
        removeOnComplete: true,
        removeOnFail: 10
      }
    );
  }

  private async refreshStressStatus(): Promise<void> {
    await Promise.all([
      this.marketService.getStressStatus("US"),
      this.marketService.getStressStatus("IN")
    ]);
  }

  private async userIds(): Promise<string[]> {
    if (!this.prisma.isConnected()) {
      return [...devStore.profiles.keys()];
    }

    const rows = await this.prisma.userProfile.findMany({
      select: { id: true }
    });
    return rows.map((row) => row.id);
  }

  private async recomputeDiscipline(): Promise<void> {
    const ids = await this.userIds();
    for (const id of ids) {
      const user: AuthUser = { uid: id };
      await this.disciplineService.getDisciplineSummary(user);
    }
  }
}
