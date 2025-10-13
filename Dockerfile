# Use Bun's official image as the base
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment variables (with defaults for local dev)
ARG DB_PEPPER="change-me-in-production"
ARG INVITATION_CODE="change-me-in-production"

# Set build-time environment variables
ENV DB_PEPPER=${DB_PEPPER}
ENV INVITATION_CODE=${INVITATION_CODE}
# Use local libSQL database file for Astro DB
ENV ASTRO_DATABASE_FILE=./.astro/content.db

# Build the application
RUN bun run build

# Production image
FROM base AS runner
WORKDIR /app

# Copy built assets (includes the standalone server)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.astro ./.astro
COPY package.json ./

# Expose the default port (can be overridden with PORT env var)
EXPOSE 4321

# Set environment to production
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

# Runtime environment variables (override these in production!)
ARG DB_PEPPER
ARG INVITATION_CODE
ENV DB_PEPPER=${DB_PEPPER}
ENV INVITATION_CODE=${INVITATION_CODE}
ENV ASTRO_DATABASE_FILE=/app/.astro/content.db

# Run the standalone Node server
CMD ["bun", "run", "./dist/server/entry.mjs"]
