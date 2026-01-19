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
# This compiles TypeScript AND builds Admin UI into dist/public/admin/
RUN npm run build

# Verify build artifacts exist
RUN echo "=== VERIFYING BUILD OUTPUT ===" && \
    ls -la dist && \
    ls -la dist/public && \
    ls -la dist/public/admin && \
    echo "✓ Admin panel found at dist/public/admin"

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts from builder
# dist/ contains BOTH backend code AND admin UI (at dist/public/admin/)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/medusa-config.ts ./

# Verify admin panel exists in production image
RUN echo "=== PRODUCTION IMAGE VERIFICATION ===" && \
    ls -la dist/public/admin && \
    test -f dist/public/admin/index.html && \
    echo "✓ Admin panel verified: dist/public/admin/index.html exists"

# Expose Medusa ports
EXPOSE 9000

# Start Medusa in production mode
# Medusa automatically serves admin from dist/public/admin/
CMD ["npm", "start"]
