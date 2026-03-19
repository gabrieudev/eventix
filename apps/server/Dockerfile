FROM oven/bun:1.2.21 AS builder

WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN bun install

RUN bunx turbo build --filter=server

FROM oven/bun:1.2.21

WORKDIR /app

COPY --from=builder /app /app

WORKDIR /app/apps/server

ENV NODE_ENV=production

EXPOSE 3000

CMD ["bun", "run", "start"]