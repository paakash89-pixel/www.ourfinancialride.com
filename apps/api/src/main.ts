import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

const parseCorsOrigins = (raw: string | undefined): string[] => {
  if (!raw) return ["http://localhost:3000", "http://localhost:19006"];
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

async function bootstrap(): Promise<void> {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: parseCorsOrigins(process.env.CORS_ORIGINS),
      credentials: true
    }
  });

  app.setGlobalPrefix("");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false
    })
  );

  app.use((req: any, res: any, next: () => void) => {
    const startedAt = Date.now();
    res.on("finish", () => {
      logger.log(
        JSON.stringify({
          event: "http_request",
          method: req.method,
          path: req.originalUrl ?? req.url,
          statusCode: res.statusCode,
          durationMs: Date.now() - startedAt
        })
      );
    });
    next();
  });

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  logger.log(
    JSON.stringify({
      event: "api_started",
      port,
      corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS)
    })
  );
}

bootstrap();
