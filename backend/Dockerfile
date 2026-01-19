FROM node:20-alpine AS base

# Install dependencies and build
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package.json ./

# CRITICAL: Remove package-lock.json to force fresh dependency resolution
# This prevents @medusajs/admin-sdk version conflicts
RUN rm -f package-lock.json

# Install ALL dependencies (including devDependencies for build)
# This ensures we get the latest compatible versions of Medusa v2 packages
RUN npm install

# Copy source code
COPY . .

# Build Medusa v2
# This command does TWO things:
# 1. Compiles TypeScript to ./dist (backend code)
# 2. Builds Admin UI to ./.medusa (admin panel static files)
RUN npm run build

# Verify build artifacts exist (fail fast if build didn't work)
RUN ls -la dist && ls -la .medusa

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.medusa ./.medusa
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/medusa-config.ts ./

# Verify critical files exist in production image
RUN ls -la .medusa/admin && echo "✓ Admin panel build found"

# Expose Medusa ports
# Port 9000: API + Admin backend
# Port 7001: Admin UI (if using separate admin server)
EXPOSE 9000 7001

# Start Medusa in production mode
# This serves both API and pre-built Admin UI
CMD ["npm", "start"]
