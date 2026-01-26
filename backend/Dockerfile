# ============================================
# Stage 1: Dependencies (Production Only)
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# ============================================
# Stage 2: Builder (Build Medusa Application)
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --ignore-scripts

# Copy application source
COPY . .

# Build the Medusa application
# This creates .medusa/server directory with compiled admin panel
RUN npm run build

# ============================================
# Stage 3: Runner (Production Runtime)
# ============================================
FROM node:20-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 medusa

# CRITICAL: Set working directory to /app/server
# This is where the built application lives (Rule 1)
WORKDIR /app/server

# Copy production dependencies from deps stage
COPY --from=deps --chown=medusa:nodejs /app/node_modules /app/node_modules
COPY --from=deps --chown=medusa:nodejs /app/package.json /app/package.json

# CRITICAL: Copy built artifacts from builder stage
# Medusa v2 builds into .medusa/server, we copy it to /app/server (Rule 1)
COPY --from=builder --chown=medusa:nodejs /app/.medusa/server ./
COPY --from=builder --chown=medusa:nodejs /app/medusa-config.ts /app/medusa-config.ts
COPY --from=builder --chown=medusa:nodejs /app/medusa-config.js /app/medusa-config.js 2>/dev/null || true

# Create uploads directory with correct permissions
RUN mkdir -p /app/server/uploads && \
    chown -R medusa:nodejs /app/server/uploads && \
    chmod -R 755 /app/server/uploads

# Switch to non-root user
USER medusa

# Expose Medusa port
EXPOSE 9000

# Set environment
ENV NODE_ENV=production
ENV PORT=9000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:9000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start Medusa server
CMD ["node", "--enable-source-maps", "./index.js"]
