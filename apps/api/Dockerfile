FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @intrinsic/shared build
RUN pnpm --filter @intrinsic/api prisma:generate
RUN pnpm --filter @intrinsic/api build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app .
EXPOSE 4000
CMD ["pnpm", "--filter", "@intrinsic/api", "start"]
