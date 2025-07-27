# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./
RUN npm install

# Copy backend source code
COPY backend/ .

# Generate Prisma client
RUN npx prisma generate

# Compile TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Copy necessary files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Install Prisma CLI globally for migration
RUN npm install -g prisma

# Set environment
ENV NODE_ENV=production

EXPOSE 3000

# Run migrations and start server
CMD prisma migrate deploy && node dist/server.js

# Stage 3: Development
FROM node:20-alpine AS development

WORKDIR /app

# Install dependencies
COPY backend/package*.json ./
RUN npm install

# Install development tools
RUN npm install -g prisma nodemon ts-node typescript

# Copy the entire backend source code
COPY backend/ .

# Generate Prisma client
RUN npx prisma generate

# Set environment
ENV NODE_ENV=development

EXPOSE 3000

# Use nodemon for hot-reloading in development
CMD ["nodemon", "--watch", "src", "--ext", "ts,json", "--exec", "ts-node", "src/server.ts"]
