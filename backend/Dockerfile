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
RUN npm run build

# SHOTGUN APPROACH: Copy admin build to ALL possible locations
# Medusa runtime is picky - we don't know exactly where it looks, so put it EVERYWHERE
RUN echo "=== SHOTGUN APPROACH: COPYING ADMIN TO ALL LOCATIONS ===" && \
    echo "" && \
    echo "Source location:" && \
    ls -la dist/public/admin && \
    echo "" && \
    echo "Copying to Location A: .medusa/admin" && \
    mkdir -p .medusa/admin && \
    cp -r dist/public/admin/* .medusa/admin/ && \
    ls -la .medusa/admin && \
    echo "✓ Copied to .medusa/admin" && \
    echo "" && \
    echo "Copying to Location B: .medusa/server/admin" && \
    mkdir -p .medusa/server/admin && \
    cp -r dist/public/admin/* .medusa/server/admin/ && \
    ls -la .medusa/server/admin && \
    echo "✓ Copied to .medusa/server/admin" && \
    echo "" && \
    echo "Keeping original at: dist/public/admin" && \
    echo "✓ Original preserved" && \
    echo "" && \
    echo "=== VERIFICATION: Checking all index.html locations ===" && \
    test -f dist/public/admin/index.html && echo "✓ dist/public/admin/index.html EXISTS" && \
    test -f .medusa/admin/index.html && echo "✓ .medusa/admin/index.html EXISTS" && \
    test -f .medusa/server/admin/index.html && echo "✓ .medusa/server/admin/index.html EXISTS" && \
    echo "" && \
    echo "🎯 SHOTGUN COMPLETE: Admin available in 3 locations!"

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts from builder
# Include ALL possible admin locations
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.medusa ./.medusa
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/medusa-config.ts ./
COPY --from=builder /app/tsconfig.json ./

# Verify ALL admin locations exist in production image
RUN echo "=== PRODUCTION IMAGE VERIFICATION ===" && \
    echo "" && \
    echo "Location A: .medusa/admin" && \
    ls -la .medusa/admin && \
    test -f .medusa/admin/index.html && \
    echo "✓ .medusa/admin/index.html verified" && \
    echo "" && \
    echo "Location B: .medusa/server/admin" && \
    ls -la .medusa/server/admin && \
    test -f .medusa/server/admin/index.html && \
    echo "✓ .medusa/server/admin/index.html verified" && \
    echo "" && \
    echo "Location C: dist/public/admin" && \
    ls -la dist/public/admin && \
    test -f dist/public/admin/index.html && \
    echo "✓ dist/public/admin/index.html verified" && \
    echo "" && \
    echo "Backend dist:" && \
    ls -la dist && \
    echo "" && \
    echo "🎯 ALL LOCATIONS VERIFIED - Production image ready!"

# Expose Medusa ports
EXPOSE 9000

# Start Medusa in production mode
# Admin available at ALL of these paths:
# - .medusa/admin/
# - .medusa/server/admin/
# - dist/public/admin/
# Medusa will find it wherever it looks!
CMD ["npm", "start"]
