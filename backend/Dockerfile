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

# CRITICAL FIX: Detect admin location and move to runtime expected location
# Medusa v2 builds admin to dist/public/admin but runtime expects .medusa/admin
RUN echo "=== DETECTING ADMIN BUILD LOCATION ===" && \
    if [ -d "dist/public/admin" ]; then \
        echo "✓ Found admin at dist/public/admin"; \
        echo "Moving to .medusa/admin for runtime..."; \
        mkdir -p .medusa/admin && \
        cp -r dist/public/admin/* .medusa/admin/ && \
        echo "✓ Admin moved successfully"; \
    elif [ -d ".medusa/admin" ]; then \
        echo "✓ Admin already at .medusa/admin"; \
    else \
        echo "✗ ERROR: Admin build not found!"; \
        echo "Searching for admin files..."; \
        find . -name "index.html" -type f 2>/dev/null || true; \
        exit 1; \
    fi

# Verify final admin location
RUN echo "=== VERIFYING BUILD OUTPUT ===" && \
    echo "Backend build:" && \
    ls -la dist && \
    echo "" && \
    echo "Admin build (.medusa/admin - runtime location):" && \
    ls -la .medusa/admin && \
    test -f .medusa/admin/index.html && \
    echo "✓ Admin panel verified at .medusa/admin/index.html"

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
