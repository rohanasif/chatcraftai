#!/bin/bash

# ChatCraftAI Docker Utilities
# This script provides common Docker operations for the ChatCraftAI project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_NAME="chatcraftai"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$DOCKER_DIR/docker-compose.yml"
COMPOSE_PROD_FILE="$DOCKER_DIR/docker-compose.prod.yml"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if docker-compose is available
check_docker_compose() {
    if ! docker compose version &> /dev/null; then
        print_error "docker compose is not available. Please install Docker Compose and try again."
        exit 1
    fi
}

# Development environment functions
dev_start() {
    print_header "Starting Development Environment"
    check_docker
    check_docker_compose

    print_status "Starting services..."
    cd "$DOCKER_DIR" && docker compose -f $COMPOSE_FILE up -d

    print_status "Waiting for services to be ready..."
    sleep 10

    print_status "Development environment is ready!"
    echo -e "${GREEN}Frontend:${NC} http://localhost:3000"
    echo -e "${GREEN}Backend API:${NC} http://localhost:3001"
    echo -e "${GREEN}PostgreSQL:${NC} localhost:5432"
    echo -e "${GREEN}Redis:${NC} localhost:6379"
}

dev_stop() {
    print_header "Stopping Development Environment"
    cd "$DOCKER_DIR" && docker compose -f $COMPOSE_FILE down
    print_status "Development environment stopped."
}

dev_restart() {
    print_header "Restarting Development Environment"
    dev_stop
    dev_start
}

dev_logs() {
    local service=${1:-""}
    if [ -z "$service" ]; then
        print_status "Showing logs for all services..."
        cd "$DOCKER_DIR" && docker compose -f $COMPOSE_FILE logs -f
    else
        print_status "Showing logs for $service..."
        cd "$DOCKER_DIR" && docker compose -f $COMPOSE_FILE logs -f $service
    fi
}

dev_shell() {
    local service=${1:-"backend"}
    print_status "Opening shell in $service container..."
    cd "$DOCKER_DIR" && docker compose -f $COMPOSE_FILE exec $service sh
}

# Production environment functions
prod_start() {
    print_header "Starting Production Environment"
    check_docker
    check_docker_compose

    print_status "Starting production services..."
    cd "$DOCKER_DIR" && docker compose -f $COMPOSE_PROD_FILE up -d --build

    print_status "Waiting for services to be ready..."
    sleep 15

    print_status "Production environment is ready!"
    echo -e "${GREEN}Application:${NC} http://localhost"
    echo -e "${GREEN}HTTPS:${NC} https://localhost (if SSL configured)"
}

prod_stop() {
    print_header "Stopping Production Environment"
    cd "$DOCKER_DIR" && docker compose -f $COMPOSE_PROD_FILE down
    print_status "Production environment stopped."
}

prod_restart() {
    print_header "Restarting Production Environment"
    prod_stop
    prod_start
}

# Database functions
db_migrate() {
    local env=${1:-"dev"}
    print_header "Running Database Migrations"

    if [ "$env" = "prod" ]; then
        print_status "Running migrations in production..."
        cd "$DOCKER_DIR" && docker compose -f $COMPOSE_PROD_FILE exec backend npx prisma migrate deploy
    else
        print_status "Running migrations in development..."
        cd "$DOCKER_DIR" && docker compose -f $COMPOSE_FILE exec backend npx prisma migrate dev
    fi
}

db_seed() {
    local env=${1:-"dev"}
    print_header "Seeding Database"

    if [ "$env" = "prod" ]; then
        print_status "Seeding production database..."
        cd "$DOCKER_DIR" && docker compose -f $COMPOSE_PROD_FILE exec backend npm run prisma:seed
    else
        print_status "Seeding development database..."
        cd "$DOCKER_DIR" && docker compose -f $COMPOSE_FILE exec backend npm run prisma:seed
    fi
}

db_backup() {
    print_header "Creating Database Backup"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="backup_${timestamp}.sql"

    print_status "Creating backup: $backup_file"
    cd "$DOCKER_DIR" && docker compose -f $COMPOSE_FILE exec postgres pg_dump -U postgres chatcraftai > "$backup_file"
    print_status "Backup created successfully: $backup_file"
}

# Maintenance functions
cleanup() {
    print_header "Cleaning Up Docker Resources"

    print_warning "This will remove all stopped containers, unused networks, and dangling images."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Cleaning up..."
        docker system prune -f
        print_status "Cleanup completed."
    else
        print_status "Cleanup cancelled."
    fi
}

full_cleanup() {
    print_header "Full Cleanup (⚠️ DESTRUCTIVE)"

    print_error "This will remove ALL containers, images, volumes, and networks!"
    read -p "Are you absolutely sure? (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Performing full cleanup..."
        cd "$DOCKER_DIR" && docker compose -f $COMPOSE_FILE down -v --rmi all 2>/dev/null || true
        cd "$DOCKER_DIR" && docker compose -f $COMPOSE_PROD_FILE down -v --rmi all 2>/dev/null || true
        docker system prune -a -f --volumes
        print_status "Full cleanup completed."
    else
        print_status "Full cleanup cancelled."
    fi
}

# Monitoring functions
status() {
    print_header "Service Status"
    cd "$DOCKER_DIR" && docker compose -f $COMPOSE_FILE ps
}

resources() {
    print_header "Resource Usage"
    docker stats --no-stream
}

health() {
    print_header "Health Checks"

    # Check backend health
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is healthy${NC}"
    else
        echo -e "${RED}✗ Backend health check failed${NC}"
    fi

    # Check database health
    if docker exec chatcraftai-postgres pg_isready -U postgres -d chatcraftai > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is healthy${NC}"
    else
        echo -e "${RED}✗ PostgreSQL health check failed${NC}"
    fi

    # Check Redis health
    if docker exec chatcraftai-redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Redis is healthy${NC}"
    else
        echo -e "${RED}✗ Redis health check failed${NC}"
    fi
}

# Help function
show_help() {
    print_header "ChatCraftAI Docker Utilities"
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Development Commands:"
    echo "  dev-start     Start development environment"
    echo "  dev-stop      Stop development environment"
    echo "  dev-restart   Restart development environment"
    echo "  dev-logs      Show logs (optional: service name)"
    echo "  dev-shell     Open shell in container (optional: service name)"
    echo ""
    echo "Production Commands:"
    echo "  prod-start    Start production environment"
    echo "  prod-stop     Stop production environment"
    echo "  prod-restart  Restart production environment"
    echo ""
    echo "Database Commands:"
    echo "  db-migrate    Run database migrations (optional: prod)"
    echo "  db-seed       Seed database (optional: prod)"
    echo "  db-backup     Create database backup"
    echo ""
    echo "Maintenance Commands:"
    echo "  cleanup       Clean up Docker resources"
    echo "  full-cleanup  Full cleanup (⚠️ destructive)"
    echo ""
    echo "Monitoring Commands:"
    echo "  status        Show service status"
    echo "  resources     Show resource usage"
    echo "  health        Run health checks"
    echo ""
    echo "Examples:"
    echo "  $0 dev-start"
    echo "  $0 dev-logs backend"
    echo "  $0 db-migrate prod"
    echo "  $0 health"
}

# Main script logic
case "${1:-help}" in
    "dev-start")
        dev_start
        ;;
    "dev-stop")
        dev_stop
        ;;
    "dev-restart")
        dev_restart
        ;;
    "dev-logs")
        dev_logs "$2"
        ;;
    "dev-shell")
        dev_shell "$2"
        ;;
    "prod-start")
        prod_start
        ;;
    "prod-stop")
        prod_stop
        ;;
    "prod-restart")
        prod_restart
        ;;
    "db-migrate")
        db_migrate "$2"
        ;;
    "db-seed")
        db_seed "$2"
        ;;
    "db-backup")
        db_backup
        ;;
    "cleanup")
        cleanup
        ;;
    "full-cleanup")
        full_cleanup
        ;;
    "status")
        status
        ;;
    "resources")
        resources
        ;;
    "health")
        health
        ;;
    "help"|*)
        show_help
        ;;
esac