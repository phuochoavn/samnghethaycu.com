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
# 1. Compiles TypeScript → dist/
# 2. Builds Admin UI → .medusa/admin/ (runtime expects it here)
RUN npm run build

# Verify BOTH build locations
RUN echo "=== VERIFYING BUILD OUTPUT ===" && \
    echo "Backend build:" && \
    ls -la dist && \
    echo "" && \
    echo "Admin build (.medusa/admin - runtime location):" && \
    ls -la .medusa/admin && \
    test -f .medusa/admin/index.html && \
    echo "✓ Admin panel found at .medusa/admin/index.html"

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
COPY --from=builder /app/tsconfig.json ./

# Verify admin panel exists in production image
RUN echo "=== PRODUCTION IMAGE VERIFICATION ===" && \
    echo "Checking .medusa/admin (runtime location):" && \
    ls -la .medusa/admin && \
    test -f .medusa/admin/index.html && \
    echo "✓ Admin panel verified at .medusa/admin/index.html" && \
    echo "" && \
    echo "Checking backend dist:" && \
    ls -la dist && \
    echo "✓ Production image ready"

# Expose Medusa ports
EXPOSE 9000

# Start Medusa in production mode
# API: http://localhost:9000/
# Admin UI: http://localhost:9000/app (serves from .medusa/admin/)
CMD ["npm", "start"]
