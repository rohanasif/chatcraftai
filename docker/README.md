# ChatCraftAI Docker Setup

This directory contains the Docker configuration for the ChatCraftAI application, providing both development and production environments.

## 🏗️ Architecture

The application consists of the following services:

- **PostgreSQL**: Primary database for user data and conversations
- **Redis**: Caching and session storage
- **Backend**: Node.js API with Prisma ORM
- **Frontend**: Next.js React application
- **Nginx**: Reverse proxy (production only)

## 🚀 Quick Start

### Development Environment

1. **Clone the repository and navigate to the docker directory:**

   ```bash
   cd docker
   ```

2. **Set up environment variables:**

   ```bash
   # Backend environment
   cp ../backend/.env.example ../backend/.env
   # Edit ../backend/.env with your configuration

   # Frontend environment
   cp ../frontend/.env.local.example ../frontend/.env.local
   # Edit ../frontend/.env.local with your configuration
   ```

3. **Start the development environment:**

   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

### Production Environment

1. **Set up environment variables:**

   ```bash
   export POSTGRES_USER=your_db_user
   export POSTGRES_PASSWORD=your_secure_password
   ```

2. **Start the production environment:**

   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Access the application:**
   - Application: http://localhost (via Nginx)
   - HTTPS: https://localhost (if SSL configured)

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
```

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Database Configuration

The PostgreSQL database is automatically initialized with the schema from `postgres/init.sql`. For production, consider:

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
docker-compose exec backend npx prisma migrate dev
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Accessing Containers

```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh

# Database shell
docker-compose exec postgres psql -U postgres -d chatcraftai
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
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

2. **Run database migrations:**

   ```bash
   docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
   ```

3. **Seed initial data (if needed):**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend npm run prisma:seed
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
docker-compose ps

# View health check logs
docker-compose exec backend curl http://localhost:3001/health
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
docker-compose logs -f --tail=100

# View logs for specific service
docker-compose logs -f backend

# Access container for debugging
docker-compose exec backend sh
```

## 🧹 Maintenance

### Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (⚠️ This will delete data)
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Full cleanup
docker system prune -a
```

### Updates

```bash
# Pull latest images
docker-compose pull

# Rebuild with latest code
docker-compose up -d --build
```

### Backups

```bash
# Backup PostgreSQL data
docker-compose exec postgres pg_dump -U postgres chatcraftai > backup.sql

# Backup Redis data
docker-compose exec redis redis-cli BGSAVE
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
3. **Memory Issues**: Adjust resource limits in docker-compose.yml
4. **Network Issues**: Verify network connectivity between containers

### Debug Commands

```bash
# Check container status
docker-compose ps

# View detailed container info
docker-compose exec backend cat /proc/1/environ

# Check network connectivity
docker-compose exec backend ping postgres

# View container logs
docker-compose logs backend
```

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [Prisma with Docker](https://www.prisma.io/docs/guides/deployment/deployment-guides/docker)
- [Nginx Configuration](https://nginx.org/en/docs/)
