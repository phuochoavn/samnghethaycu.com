FROM node:20-alpine AS base

# ============================================
# STAGE 1: Dependencies
# ============================================
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# ============================================
# STAGE 2: Builder
# ============================================
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build Medusa v2
# This creates .medusa/server/ with the complete built application
RUN npm run build

# Verify build output
RUN echo "=== VERIFYING MEDUSA V2 BUILD OUTPUT ===" && \
    ls -la .medusa/server && \
    echo "" && \
    echo "Checking for admin build:" && \
    ls -la .medusa/server/public/admin && \
    test -f .medusa/server/public/admin/index.html && \
    echo "✓ Admin panel found at .medusa/server/public/admin/index.html" && \
    echo "" && \
    echo "✓ Build successful - Medusa v2 architecture verified"

# ============================================
# STAGE 3: Production Runner
# ============================================
FROM base AS runner

# CRITICAL: Set working directory to /app/server
# This is where Medusa v2 builds the complete application
# When the app runs from here, it correctly resolves relative paths to public/admin
WORKDIR /app/server

ENV NODE_ENV=production

# Copy the built application from builder
# Medusa v2 builds everything into .medusa/server/
COPY --from=builder /app/.medusa/server ./

# Copy node_modules (contains runtime dependencies)
COPY --from=builder /app/node_modules ./node_modules

# Verify production image structure
RUN echo "=== PRODUCTION IMAGE VERIFICATION ===" && \
    pwd && \
    echo "" && \
    echo "Application structure:" && \
    ls -la && \
    echo "" && \
    echo "Admin location:" && \
    ls -la public/admin && \
    test -f public/admin/index.html && \
    echo "✓ Admin panel verified at public/admin/index.html" && \
    echo "" && \
    echo "✓ Production image ready - WORKDIR=/app/server"

# Expose Medusa port
EXPOSE 9000

# Start Medusa in production mode
# Running from /app/server, Medusa naturally finds public/admin/
CMD ["npm", "run", "start"]
