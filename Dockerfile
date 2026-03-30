# --- STAGE 1: Builder ---
FROM oven/bun:1.3.11-alpine AS builder
WORKDIR /app

# Keep your original dependency for native modules
RUN apk add --no-cache libc6-compat

# Copy EVERYTHING first to ensure we don't miss hidden config files
COPY . .

# Install and Build
RUN bun install --frozen-lockfile
RUN bun run build

# --- STAGE 2: Runner ---
FROM oven/bun:1.3.11-alpine AS runner
WORKDIR /app

# Re-create your appuser for security
RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -G appuser -S appuser

# COPY THE ESSENTIALS BACK

COPY --from=builder --chown=1001:1001 /app/public ./public
COPY --from=builder --chown=1001:1001 /app/node_modules ./node_modules
COPY --from=builder --chown=1001:1001 /app/src/views ./src/views
COPY --from=builder --chown=1001:1001 /app/package.json ./package.json

COPY --from=builder --chown=1001:1001 /app/.env* ./

USER 1001
EXPOSE 3000

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV HOME=/app

CMD ["bun", "public/index.js"]