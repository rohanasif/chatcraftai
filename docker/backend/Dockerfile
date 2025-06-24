# Multi-stage build for better optimization
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache python3 make g++ curl

# Set working directory
WORKDIR /app

# Copy package files and Prisma schema
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install all dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Development stage
FROM base AS development

WORKDIR /app

# Copy node_modules from base
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/prisma ./prisma

# Copy source code
COPY backend/ .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start dev server
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production

WORKDIR /app

# Copy node_modules from base
COPY --from=base /app/node_modules ./node_modules

# Copy source code
COPY backend/ .

# Build app
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Create non-root user for production
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Fix ownership and drop to non-root
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start app
CMD ["npm", "start"]
