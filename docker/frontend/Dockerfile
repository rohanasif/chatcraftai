# Multi-stage build for better optimization
FROM node:20-alpine AS base

# Install OS-level compatibility tools
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Development stage
FROM base AS development

# Install dependencies
RUN npm ci

# Copy the rest of the app
COPY . .

# Expose dev port
EXPOSE 3000

# Start Next.js in dev mode (Turbopack for faster HMR)
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy the rest of the app
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]