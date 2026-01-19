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

# DEBUG: Show complete directory structure to find admin files
RUN echo "=== DIRECTORY STRUCTURE AFTER BUILD ===" && \
    ls -la && \
    echo "=== CHECKING .medusa DIRECTORY ===" && \
    ls -la .medusa 2>/dev/null || echo ".medusa not found" && \
    echo "=== CHECKING dist DIRECTORY ===" && \
    ls -la dist 2>/dev/null || echo "dist not found" && \
    echo "=== SEARCHING FOR index.html (admin entry point) ===" && \
    find . -name "index.html" -type f 2>/dev/null || echo "No index.html found" && \
    echo "=== SEARCHING FOR admin DIRECTORIES ===" && \
    find . -type d -name "admin" 2>/dev/null || echo "No admin directories found"

# Verify build artifacts exist (fail fast if build didn't work)
# Using dynamic search instead of hardcoded path
RUN if [ -d "dist" ]; then echo "✓ dist folder found"; else echo "✗ dist folder missing" && exit 1; fi

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

# DEBUG: Verify what we copied to production image
RUN echo "=== PRODUCTION IMAGE CONTENTS ===" && \
    ls -la && \
    echo "=== .medusa DIRECTORY ===" && \
    ls -la .medusa 2>/dev/null || echo ".medusa not found in production image" && \
    echo "=== SEARCHING FOR index.html IN PRODUCTION ===" && \
    find . -name "index.html" -type f 2>/dev/null || echo "No index.html in production image"

# Expose Medusa ports
# Port 9000: API + Admin backend
# Port 7001: Admin UI (if using separate admin server)
EXPOSE 9000 7001

# Start Medusa in production mode
# This serves both API and pre-built Admin UI
CMD ["npm", "start"]
