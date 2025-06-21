# ChatCraftAI

A real-time, AI-augmented messaging platform built with Node.js, TypeScript, Express, PostgreSQL, Redis, OpenAI SDK, WebSocket, and Next.js.

## Overview

ChatCraftAI is a modern messaging platform that combines real-time communication with AI-powered features to enhance user experience. The platform supports both 1:1 conversations and group chats, with intelligent features like grammar correction, quick reply suggestions, and conversation analytics.

## User Flow

### Sign Up & Sign In

- New users register with email, password, display name, and optional avatar
- Registered users log in and land on their Conversations dashboard

### Conversation Management

- **1:1 Chat**: Click "New Chat," select another user by email or username to start a private conversation
- **Group Chats**: Managed exclusively by an Admin user. The Admin creates and configures all group conversations (sets title, invites users)
- **Group Discovery**: All non-admin users can view and join existing groups from the dashboard without requiring an invitation
- **Dashboard** lists all conversations with:
  - Title (or other user's name for 1:1 chats)
  - Last message snippet
  - Unread message count badge

### Real-Time Messaging

- Enter a conversation: message feed auto-loads recent history and listens for new messages via WebSocket
- Typing indicators show when others are typing
- Presence: Avatars of currently online conversation members

### AI-Powered Enhancements

- **Inline Grammar Correction**: As you type, underlined errors appear; hover or press a shortcut to accept corrections
- **Quick-Reply Suggestions**: Click the "🤖" button to fetch 3–5 AI-generated reply options based on the last few messages. Click to send
- **Post-Chat Summaries**: If a conversation is inactive for 1 hour, an AI-generated summary and sentiment chart become available in the Analytics tab

### Analytics & Insights

Within each conversation:

- **Summary**: 2–3 sentence overview of the chat
- **Stats**: Total messages, word count, number of AI suggestions used

## Technical Stack

### Backend

- **Runtime**: Node.js (v18+)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (v15+) with Prisma ORM
- **Cache**: Redis (v7+)
- **AI**: OpenAI Node.js SDK
- **Real-time**: WebSocket (ws)
- **Authentication**: JWT with HttpOnly cookies

### Frontend

- **Framework**: Next.js (v13+)
- **Language**: TypeScript
- **UI**: React (v18+)
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Real-time**: WebSocket client

### DevOps

- **Containerization**: Docker & Docker Compose
- **Testing**: Jest, React Testing Library
- **Linting**: ESLint
- **Database Migrations**: Prisma Migrate

## Project Structure

```
chatcraftai/
├── backend/           # Node.js API server
│   ├── routes/        # API endpoints
│   ├── middleware/    # Express middleware
│   ├── services/      # Business logic
│   ├── prisma/        # Database schema & migrations
│   └── server.ts      # Main server file
├── frontend/          # Next.js React app
│   ├── src/
│   │   ├── app/       # Next.js app router
│   │   ├── components/ # React components
│   │   ├── contexts/   # React contexts
│   │   ├── services/   # API & WebSocket services
│   │   └── types/      # TypeScript types
│   └── package.json
├── docker/            # Docker configuration
│   ├── docker-compose.yml
│   ├── backend/Dockerfile
│   ├── frontend/Dockerfile
│   └── nginx/nginx.conf
├── tests/             # Test files
│   ├── backend/       # Backend integration tests
│   ├── frontend/      # Frontend E2E tests
│   └── integration/   # End-to-end tests
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Environment Variables

Create `.env` files in both `backend/` and `frontend/` directories:

#### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chatcraftai"

# Redis
REDIS_URL="redis://localhost:6379"

# OpenAI
OPENAI_KEY="your_openai_api_key"

# JWT
JWT_SECRET="your_jwt_secret_key"

# Server
PORT=3001
NODE_ENV=development
```

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_WS_URL="ws://localhost:3001"
```

### Quick Start with Docker

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd chatcraftai
   ```

2. **Set up environment variables**

   ```bash
   # Create and edit the environment files
   nano backend/.env
   nano frontend/.env.local
   # Add your configuration values to these files
   ```

3. **Start all services**

   ```bash
   docker-compose -f docker/docker-compose.yml up -d
   ```

4. **Run database migrations**

   ```bash
   docker-compose exec backend npm run prisma:migrate
   ```

5. **Seed initial data**

   ```bash
   docker-compose exec backend npm run prisma:seed
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5432
   - Redis: localhost:6379

### Manual Setup

1. **Backend Setup**

   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma migrate dev
   npm run seed
   npm run dev
   ```

2. **Frontend Setup**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Database Setup**

   ```bash
   # Start PostgreSQL and Redis
   docker-compose -f docker/docker-compose.yml up postgres redis -d

   # Run migrations
   cd backend
   npx prisma migrate dev
   npm run seed
   ```

## Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### All Tests

```bash
npm run test:all
```

## API Documentation

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Conversations

- `GET /api/conversations` - List user conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/:id` - Get conversation details
- `POST /api/conversations/:id/join` - Join group conversation

### Messages

- `GET /api/conversations/:id/messages` - Get conversation messages
- `POST /api/conversations/:id/messages` - Send message
- `GET /api/conversations/:id/analytics` - Get conversation analytics

### AI Features

- `POST /api/ai/grammar` - Grammar correction
- `POST /api/ai/suggestions` - Quick reply suggestions
- `POST /api/ai/summarize` - Conversation summarization

## WebSocket Events

- `join` - Join conversation room
- `message:send` - Send message
- `typing:start/stop` - Typing indicators
- `suggestion:reply` - AI reply suggestions
- `suggestion:grammar` - Grammar corrections

## Development

### Code Quality

- ESLint for linting
- Prettier for code formatting
- Husky for pre-commit hooks

### Database

- Prisma for database management
- Migrations for schema changes
- Seed script for initial data

### Deployment

- Docker containers for all services
- Nginx reverse proxy
- Environment-specific configurations

## Videos

### Code Overview (8-10 min)

_[Link to be added]_ - Walk through repository structure, highlight key flows (authentication, WebSocket implementation, GPT integration)

### Functionality Demo (5-7 min)

_[Link to be added]_ - Show end-to-end user flow, AI features, and analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.
