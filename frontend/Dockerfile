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

# Build-time argument for Next.js client-side variable inlining
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ==============================================================================
# Stage 3: Minimal Production Runtime (~80MB footprint)
# ==============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# Essential in Docker: Bind to 0.0.0.0 to accept traffic from outside the container
ENV HOSTNAME="0.0.0.0"

# Install curl for container health checks
RUN apk add --no-cache curl

# Security: Run as unprivileged non-root user
USER node

# Copy standalone build output & static assets
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

EXPOSE 3000

# Docker Container Healthcheck
HEALTHCHECK --interval=20s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
