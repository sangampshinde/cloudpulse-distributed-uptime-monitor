# ==============================================================================
# Stage 1: Dependency Installation & Layer Caching
# ==============================================================================
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ==============================================================================
# Stage 2: Application Build
# ==============================================================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --omit=dev

# ==============================================================================
# Stage 3: Production Runtime (Minimal Attack Surface)
# ==============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install curl for container health checks
RUN apk add --no-cache curl

# Copy compiled code and pruned production dependencies with proper ownership
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./package.json

# Security best practice: switch from root to non-root user
USER node

EXPOSE 4000

# Docker Container Healthcheck
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/api/v1/health/liveness || exit 1

CMD ["node", "dist/main.js"]
