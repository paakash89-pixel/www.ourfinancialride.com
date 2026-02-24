import { INestApplication, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);
  private connected = false;

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.connected = true;
    } catch (error) {
      this.connected = false;
      if (process.env.NODE_ENV === "production") {
        throw error;
      }

      this.logger.warn(
        "Database unavailable. Falling back to in-memory dev persistence."
      );
    }
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    process.on("beforeExit", async () => {
      await app.close();
    });
  }

  isConnected(): boolean {
    return this.connected;
  }
}
