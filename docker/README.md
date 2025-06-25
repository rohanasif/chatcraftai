# ChatCraftAI Docker Setup

This directory contains the Docker configuration for ChatCraftAI, a real-time AI-augmented messaging platform.

## Quick Start

### Initial Setup (First Time Only)

1. **Build and start all services:**

   ```bash
   docker compose up --build
   ```

2. **Seed the database with initial users (run this once after containers are up):**

   ```bash
   docker exec chatcraftai-backend npm run prisma:seed
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

> **⚠️ Important**: The database starts empty. You must run the seeding command to create initial users and data:
>
> ```bash
> docker exec chatcraftai-backend npm run prisma:seed
> ```

### Default Users (after seeding)

- **Admin User:**

  - Email: `admin@chatcraft.com`
  - Password: `admin123`
  - Role: Administrator

- **Regular Users:**
  - Email: `user1@chatcraft.com`
  - Password: `user123`
  - Email: `user2@chatcraft.com`
  - Password: `user123`

## Container Management

### Start Services

```bash
docker compose up
```

### Stop Services

```bash
docker compose down
```

### Restart Services

```bash
docker compose restart
```

### View Logs

```bash
# All services
docker compose logs

# Specific service
docker compose logs backend
docker compose logs frontend
docker compose logs postgres
```

### Access Container Shell

```bash
# Backend container
docker exec -it chatcraftai-backend sh

# Frontend container
docker exec -it chatcraftai-frontend sh

# PostgreSQL container
docker exec -it chatcraftai-postgres psql -U postgres -d chatcraftai
```

## Data Persistence

### Database Data

- PostgreSQL data is persisted in the `postgres_data` volume
- **Users and data will persist across container restarts**
- Data is only lost when the volume is explicitly removed

### Redis Data

- Redis data is persisted in the `redis_data` volume
- Session data and cache will persist across restarts

### Node Modules

- Backend and frontend node_modules are cached in separate volumes
- This speeds up container startup after the initial build

## Seeding Strategy

### Initial Seeding

- **Build containers once:** `docker compose up --build`
- **Seed at runtime:** `docker exec chatcraftai-backend npm run prisma:seed`
- **Users persist** across all subsequent `docker compose up/down` cycles

### When to Re-seed

- Only re-seed if you want to reset all data to initial state
- To re-seed, run: `docker exec chatcraftai-backend npm run prisma:seed`

### Data Reset

If you need to completely reset the database:

```bash
# Stop containers
docker compose down

# Remove volumes (WARNING: This deletes all data)
docker volume rm chatcraftai_postgres_data chatcraftai_redis_data

# Rebuild and start
docker compose up --build

# Re-seed
docker exec chatcraftai-backend npm run prisma:seed
```

## Services Overview

### PostgreSQL (Database)

- **Port:** 5432
- **Database:** chatcraftai
- **User:** postgres
- **Password:** postgres
- **Volume:** postgres_data
- **Health Check:** pg_isready

### Redis (Cache)

- **Port:** 6379
- **Volume:** redis_data
- **Configuration:** ./redis/redis.conf
- **Health Check:** redis-cli ping

### Backend (Node.js API)

- **Port:** 3001
- **Environment:** Development
- **Features:**
  - Health checks
  - Live code reloading with nodemon
  - WebSocket server for real-time communication
  - Prisma ORM with PostgreSQL

### Frontend (Next.js)

- **Port:** 3000
- **Environment:** Development
- **Features:**
  - Hot module replacement with Turbopack
  - Live code reloading
  - Material-UI components
  - WebSocket client for real-time updates

### Nginx (Production Only)

- **Ports:** 80, 443
- **Profile:** production
- **Usage:** `docker compose --profile production up`
- **SSL:** Configured for HTTPS in production

## Environment Variables

### Backend (.env)

```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/chatcraftai
REDIS_URL=redis://redis:6379
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
FRONTEND_URL=http://localhost:3000
PORT=3001
```

### Frontend (.env)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check PostgreSQL logs
docker compose logs postgres

# Test connection
docker exec chatcraftai-postgres pg_isready -U postgres
```

### Backend Issues

```bash
# Check backend logs
docker compose logs backend

# Restart backend
docker compose restart backend

# Access backend shell
docker exec -it chatcraftai-backend sh
```

### Frontend Issues

```bash
# Check frontend logs
docker compose logs frontend

# Restart frontend
docker compose restart frontend

# Clear Next.js cache
docker exec chatcraftai-frontend rm -rf .next
```

### Volume Issues

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect chatcraftai_postgres_data

# Remove volume (WARNING: Deletes data)
docker volume rm chatcraftai_postgres_data
```

## Production Deployment

For production deployment, use the production profile:

```bash
# Build and start production services
docker compose -f docker-compose.prod.yml up -d --build

# Run database migrations
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Seed initial data (if needed)
docker compose -f docker-compose.prod.yml exec backend npm run prisma:seed
```

### Production Environment Variables

For production, ensure these environment variables are properly set:

```env
# Backend (.env)
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/chatcraftai
REDIS_URL=redis://host:6379
JWT_SECRET=your_strong_jwt_secret
OPENAI_API_KEY=your_openai_api_key
FRONTEND_URL=https://yourdomain.com
PORT=3001

# Frontend (.env)
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_WS_URL=wss://yourdomain.com
```

## Development Workflow

1. **Initial setup:** `docker compose up --build` then `docker exec chatcraftai-backend npm run prisma:seed`
2. **Start services:** `docker compose up`
3. **Make code changes** - they'll be reflected automatically
4. **Test changes** in the browser
5. **Stop services:** `docker compose down`
6. **Restart when needed:** `docker compose up`

The setup is optimized for development with live code reloading and persistent data across restarts.

## 📁 File Structure

```
docker/
├── backend/
│   └── Dockerfile          # Backend container configuration
├── frontend/
│   └── Dockerfile          # Frontend container configuration
├── nginx/
│   ├── nginx.conf          # Nginx configuration
│   └── ssl/                # SSL certificates (production)
├── postgres/
│   └── init.sql            # Database initialization script
├── redis/
│   └── redis.conf          # Redis configuration
├── scripts/
│   └── docker-utils.sh     # Docker utility scripts
├── docker-compose.yml      # Development environment
├── docker-compose.prod.yml # Production environment
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/chatcraftai
REDIS_URL=redis://redis:6379
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
FRONTEND_URL=http://localhost:3000
PORT=3001
```

#### Frontend (.env)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Database Configuration

The PostgreSQL database is automatically initialized with the schema from Prisma migrations. For production, consider:

- Using external database services (AWS RDS, Google Cloud SQL)
- Setting up database backups
- Configuring connection pooling

### Redis Configuration

Redis is configured for caching and session storage. The configuration can be customized in `redis/redis.conf`.

## 🛠️ Development Workflow

### Hot Reloading

Both frontend and backend support hot reloading in development:

- **Frontend**: Next.js with Turbopack for fast HMR
- **Backend**: Nodemon for automatic restarts

### Database Migrations

Run Prisma migrations in the backend container:

```bash
docker compose exec backend npx prisma migrate dev
```

### Viewing Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
```

### Accessing Containers

```bash
# Backend shell
docker compose exec backend sh

# Frontend shell
docker compose exec frontend sh

# Database shell
docker compose exec postgres psql -U postgres -d chatcraftai
```

## 🚀 Production Deployment

### Prerequisites

1. **SSL Certificates**: Place your SSL certificates in `nginx/ssl/`
2. **Environment Variables**: Set production environment variables
3. **Database**: Consider using managed database services
4. **Monitoring**: Set up logging and monitoring solutions

### Deployment Steps

1. **Build and start production services:**

   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

2. **Run database migrations:**

   ```bash
   docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
   ```

3. **Seed initial data (if needed):**
   ```bash
   docker compose -f docker-compose.prod.yml exec backend npm run prisma:seed
   ```

### Scaling

For production scaling, consider:

- Using Docker Swarm or Kubernetes
- Implementing load balancing
- Setting up auto-scaling based on metrics
- Using external caching services (Redis Cloud, AWS ElastiCache)

## 🔍 Monitoring and Debugging

### Health Checks

All services include health checks:

```bash
# Check service health
docker compose ps

# View health check logs
docker compose exec backend curl http://localhost:3001/health
```

### Resource Monitoring

Monitor container resources:

```bash
# View resource usage
docker stats

# View specific container stats
docker stats chatcraftai-backend
```

### Logs and Debugging

```bash
# View real-time logs
docker compose logs -f --tail=100

# View logs for specific service
docker compose logs -f backend

# Access container for debugging
docker compose exec backend sh
```

## 🧹 Maintenance

### Cleanup

```bash
# Stop and remove containers
docker compose down

# Remove volumes (⚠️ This will delete data)
docker compose down -v

# Remove images
docker compose down --rmi all

# Full cleanup
docker system prune -a
```

### Updates

```bash
# Pull latest images
docker compose pull

# Rebuild with latest code
docker compose up -d --build
```

### Backups

```bash
# Backup PostgreSQL data
docker compose exec postgres pg_dump -U postgres chatcraftai > backup.sql

# Backup Redis data
docker compose exec redis redis-cli BGSAVE
```

## 🔒 Security Considerations

1. **Environment Variables**: Never commit sensitive data to version control
2. **Network Security**: Use internal networks for service communication
3. **User Permissions**: Run containers as non-root users
4. **SSL/TLS**: Always use HTTPS in production
5. **Database Security**: Use strong passwords and limit access
6. **Regular Updates**: Keep base images and dependencies updated

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 3000, 3001, 5432, 6379 are available
2. **Permission Issues**: Check file permissions for mounted volumes
3. **Memory Issues**: Adjust resource limits in docker compose.yml
4. **Network Issues**: Verify network connectivity between containers

### Debug Commands

```bash
# Check container status
docker compose ps

# View detailed container info
docker compose exec backend cat /proc/1/environ

# Check network connectivity
docker compose exec backend ping postgres

# View container logs
docker compose logs backend
```

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [Prisma with Docker](https://www.prisma.io/docs/guides/deployment/deployment-guides/docker)
- [Nginx Configuration](https://nginx.org/en/docs/)
