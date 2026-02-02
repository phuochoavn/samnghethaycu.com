# ==========================================
# STAGE 1: Base & Dependencies
# ==========================================
FROM node:20-alpine AS base
WORKDIR /app

# Install system dependencies for native modules (sharp, etc.)
RUN apk add --no-cache libc6-compat python3 make g++

# ==========================================
# STAGE 2: Dependencies Installation
# ==========================================
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./

# Install ALL dependencies (including devDeps for build)
RUN if [ -f package-lock.json ]; then \
      npm ci; \
    else \
      npm install; \
    fi

# ==========================================
# STAGE 3: Builder
# ==========================================
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Environment variables required for build (Admin generation)
ENV NODE_ENV=production
ENV MEDUSA_ADMIN_ONBOARDING_TYPE=nextjs

# Build Medusa v2 - Generates .medusa/server directory
RUN npm run build

# Verify build output
RUN echo "=== BUILD VERIFICATION ===" && \
    ls -la .medusa/server && \
    echo "" && \
    echo "Admin build location:" && \
    ls -la .medusa/server/public/admin && \
    test -f .medusa/server/public/admin/index.html && \
    echo "✓ Admin panel verified at .medusa/server/public/admin/index.html"

# Prune devDependencies to keep image small
RUN npm prune --production

# ==========================================
# STAGE 4: Production Runner
# ==========================================
FROM node:20-alpine AS runner

# CRITICAL: WORKDIR must be /app/server (where Medusa builds to)
# This aligns runtime context with build artifacts
WORKDIR /app/server

ENV NODE_ENV=production

# Install runtime dependencies only
RUN apk add --no-cache libc6-compat

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 medusa

# CRITICAL: Copy .medusa/server/* to /app/server
# This is the complete built application (backend + admin)
COPY --from=builder --chown=medusa:nodejs /app/.medusa/server ./

# Copy production node_modules
COPY --from=builder --chown=medusa:nodejs /app/node_modules ./node_modules

# Create uploads directory with correct permissions
RUN mkdir -p uploads && chown -R medusa:nodejs uploads

# Verify production image structure
RUN echo "=== PRODUCTION IMAGE VERIFICATION ===" && \
    pwd && \
    echo "" && \
    echo "Directory structure:" && \
    ls -la && \
    echo "" && \
    echo "Admin location (relative to WORKDIR):" && \
    ls -la public/admin && \
    test -f public/admin/index.html && \
    echo "✓ Production image ready - Admin at public/admin/index.html"

# Switch to non-root user
USER medusa

EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:9000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Medusa (running from /app/server)
CMD ["npm", "run", "start"]
