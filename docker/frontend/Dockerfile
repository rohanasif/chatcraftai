# Multi-stage build for better optimization
FROM node:20-alpine AS base

# Install OS-level compatibility tools
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Development stage
FROM base AS development

WORKDIR /app

# Copy installed node_modules from base
COPY --from=base /app/node_modules ./node_modules

# Copy source code
COPY . .

# Expose dev port
EXPOSE 3000

# Start Next.js in dev mode
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production

WORKDIR /app

# Copy node_modules from base
COPY --from=base /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_WS_URL=ws://localhost/ws

# Build the application
RUN npm run build

# Create non-root user for production
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Fix ownership and drop to non-root
RUN chown -R nodejs:nodejs /app && \
    chmod -R 755 /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
