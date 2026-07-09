# Multi-stage build for deploying to AWS App Runner (see
# infra/lib/stacks/apprunner-stack.ts). Moved off Amplify Hosting because its
# Web Compute runtime never reliably delivered environment variables to the
# running Next.js SSR process — App Runner's container env vars / Secrets
# Manager integration are the standard, well-tested mechanism instead.

FROM node:20-slim AS base
# Prisma's query engine needs OpenSSL; without it present it falls back to
# guessing the version, which can select the wrong engine binary at runtime.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# --- deps: install once, cached across builds unless package*.json change ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: package.json's postinstall runs `prisma generate`, which
# needs prisma/schema.prisma — not copied into this deps-only layer (kept
# minimal so it stays cached when only app source changes). The builder
# stage below runs it explicitly instead, once the full source is present.
RUN npm ci --ignore-scripts

# --- builder: generate Prisma client + compile the Next.js app ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# --- runner: minimal production image ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Next.js's standalone output-file tracing doesn't reliably pick up Prisma's
# generated client + native query-engine binary (a well-known gotcha for
# Next.js + Prisma Docker deployments) — copy it explicitly to be sure.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
